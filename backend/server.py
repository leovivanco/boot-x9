import os
import threading
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, constr, conint, field_validator

from crawler import check_page
from db import get_monitor_by_id, init_db, upsert_monitor
from notifier import send_email_smtp

load_dotenv()


class MonitorRequest(BaseModel):
    url: str
    match: constr(min_length=1)
    interval_hours: conint(ge=1, le=24)
    email_to: str
    email_message: str
    access_password: constr(min_length=1)

    @field_validator("interval_hours")
    @classmethod
    def validate_interval(cls, value: int) -> int:
        allowed = {1, 3, 6, 12}
        if value not in allowed:
            raise ValueError("interval_hours must be one of: 1, 3, 6, 12")
        return value


app = FastAPI(title="Crawler X9")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)

LOGS: Dict[str, List[Dict[str, Any]]] = {}
MONITOR_STATE: Dict[str, Dict[str, Any]] = {}


def add_log(monitor_id: str, message: str, level: str = "info") -> None:
    LOGS.setdefault(monitor_id, []).append(
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
        }
    )
    if len(LOGS[monitor_id]) > 500:
        del LOGS[monitor_id][:100]


def heartbeat_loop() -> None:
    while True:
        for monitor_id in list(LOGS.keys()):
            add_log(monitor_id, "heartbeat: crawler is alive")
        time.sleep(300)


def run_check(monitor_id: str, req: MonitorRequest) -> None:
    MONITOR_STATE.setdefault(monitor_id, {})
    MONITOR_STATE[monitor_id]["last_check"] = datetime.now(timezone.utc).isoformat()
    found, detail = check_page(req.url, selector=None, text=req.match)
    if found:
        add_log(monitor_id, f"match found for {req.url} ({detail})", "match")
        smtp_host = os.getenv("SMTP_HOST", "smtp.mail.yahoo.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        email_from = os.getenv("EMAIL_FROM")
        if smtp_user and smtp_pass and email_from:
            subject = "Crawler X9 alert"
            content = req.email_message or f"Match found on {req.url}: {detail}"
            try:
                send_email_smtp(
                    smtp_host,
                    smtp_port,
                    smtp_user,
                    smtp_pass,
                    email_from,
                    req.email_to,
                    subject,
                    content,
                )
                add_log(monitor_id, f"email sent to {req.email_to}", "email")
            except Exception as exc:
                add_log(monitor_id, f"email failed: {exc}", "error")
        else:
            add_log(monitor_id, "email skipped: missing SMTP_USER/SMTP_PASS/EMAIL_FROM", "error")
    else:
        add_log(monitor_id, f"no match for {req.url} ({detail})")


def schedule_loop(monitor_id: str, req: MonitorRequest) -> None:
    add_log(monitor_id, f"schedule started for {req.url} every {req.interval_hours}h")
    while True:
        MONITOR_STATE.setdefault(monitor_id, {})
        MONITOR_STATE[monitor_id]["next_check"] = (
            datetime.now(timezone.utc) + timedelta(hours=req.interval_hours)
        ).isoformat()
        time.sleep(req.interval_hours * 3600)
        run_check(monitor_id, req)


@app.on_event("startup")
async def startup_event() -> None:
    init_db()
    thread = threading.Thread(target=heartbeat_loop, daemon=True)
    thread.start()


@app.post("/monitor")
async def create_monitor(req: MonitorRequest) -> Dict[str, Any]:
    required_password = os.getenv("MONITOR_PASSWORD")
    if required_password and req.access_password != required_password:
        raise HTTPException(status_code=401, detail="invalid_password")
    monitor_id = str(uuid.uuid4())
    monitor_id, created = upsert_monitor(
        monitor_id, req.url, req.match, req.interval_hours, req.email_to
    )
    add_log(monitor_id, f"monitor {'created' if created else 'reused'} for {req.url}")
    run_check(monitor_id, req)
    threading.Thread(target=schedule_loop, args=(monitor_id, req), daemon=True).start()

    base_url = os.getenv("MONITOR_BASE_URL", "http://localhost:3000/monitor")
    monitor_url = f"{base_url}/{monitor_id}"

    smtp_host = os.getenv("SMTP_HOST", "smtp.mail.yahoo.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM")
    if smtp_user and smtp_pass and email_from:
        subject = "Crawler X9 monitoring link"
        content = f"Your monitor is ready: {monitor_url}"
        try:
            send_email_smtp(
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_pass,
                email_from,
                req.email_to,
                subject,
                content,
            )
            add_log(monitor_id, f"monitor link sent to {req.email_to}", "email")
        except Exception as exc:
            add_log(monitor_id, f"monitor link email failed: {exc}", "error")
    else:
        add_log(
            monitor_id,
            "monitor link email skipped: missing SMTP_USER/SMTP_PASS/EMAIL_FROM",
            "error",
        )

    return {"ok": True, "monitor_id": monitor_id, "monitor_url": monitor_url}


@app.get("/logs/{monitor_id}")
async def get_logs(monitor_id: str) -> List[Dict[str, Any]]:
    return LOGS.get(monitor_id, [])[-100:]


@app.get("/status/{monitor_id}")
async def get_status(monitor_id: str) -> Dict[str, Any]:
    monitor = get_monitor_by_id(monitor_id)
    if monitor is None:
        return {"active": False}

    state = MONITOR_STATE.get(monitor_id, {})
    return {
        "active": True,
        "url": monitor["url"],
        "match": monitor["match"],
        "email_to": monitor["email_to"],
        "interval_hours": monitor["interval_hours"],
        "last_check": state.get("last_check"),
        "next_check": state.get("next_check"),
    }


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"ok": True}
