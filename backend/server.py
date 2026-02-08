import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr, conint, field_validator

from .crawler import check_page
from .notifier import send_email_smtp


class MonitorRequest(BaseModel):
    url: str
    match: constr(min_length=1)
    interval_hours: conint(ge=1, le=24)
    email_to: str
    email_message: str

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

LOGS: List[Dict[str, Any]] = []
CURRENT_MONITOR: Optional[MonitorRequest] = None
MONITOR_STATE: Dict[str, Any] = {
    "last_check": None,
    "next_check": None,
}


def add_log(message: str, level: str = "info") -> None:
    LOGS.append(
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
        }
    )
    if len(LOGS) > 500:
        del LOGS[:100]


def heartbeat_loop() -> None:
    while True:
        add_log("heartbeat: crawler is alive")
        time.sleep(300)


def run_check(req: MonitorRequest) -> None:
    MONITOR_STATE["last_check"] = datetime.now(timezone.utc).isoformat()
    found, detail = check_page(req.url, selector=None, text=req.match)
    if found:
        add_log(f"match found for {req.url} ({detail})", "match")
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
                add_log(f"email sent to {req.email_to}", "email")
            except Exception as exc:
                add_log(f"email failed: {exc}", "error")
        else:
            add_log("email skipped: missing SMTP_USER/SMTP_PASS/EMAIL_FROM", "error")
    else:
        add_log(f"no match for {req.url} ({detail})")


def schedule_loop(req: MonitorRequest) -> None:
    add_log(f"schedule started for {req.url} every {req.interval_hours}h")
    while True:
        MONITOR_STATE["next_check"] = (
            datetime.now(timezone.utc) + timedelta(hours=req.interval_hours)
        ).isoformat()
        time.sleep(req.interval_hours * 3600)
        run_check(req)


@app.on_event("startup")
async def startup_event() -> None:
    thread = threading.Thread(target=heartbeat_loop, daemon=True)
    thread.start()


@app.post("/monitor")
async def create_monitor(req: MonitorRequest) -> Dict[str, Any]:
    add_log(f"monitor created for {req.url}")
    global CURRENT_MONITOR
    CURRENT_MONITOR = req
    run_check(req)
    threading.Thread(target=schedule_loop, args=(req,), daemon=True).start()
    return {"ok": True}


@app.get("/logs")
async def get_logs() -> List[Dict[str, Any]]:
    return LOGS[-100:]


@app.get("/status")
async def get_status() -> Dict[str, Any]:
    if CURRENT_MONITOR is None:
        return {"active": False}

    return {
        "active": True,
        "url": CURRENT_MONITOR.url,
        "match": CURRENT_MONITOR.match,
        "email_to": CURRENT_MONITOR.email_to,
        "interval_hours": CURRENT_MONITOR.interval_hours,
        "last_check": MONITOR_STATE.get("last_check"),
        "next_check": MONITOR_STATE.get("next_check"),
    }
