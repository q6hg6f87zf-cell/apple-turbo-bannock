"""Install and launch the actual bundled iOS app; preserve visual evidence."""
import base64
import json
from pathlib import Path
import subprocess
import time


def run(*args, timeout=180):
    print("Running: " + " ".join(args), flush=True)
    return subprocess.check_output(args, text=True, timeout=timeout).strip()


runtimes = json.loads(run("xcrun", "simctl", "list", "runtimes", "--json"))["runtimes"]
compatible = {r["identifier"] for r in runtimes if r["isAvailable"] and r["version"].startswith("26.") and "iOS" in r["identifier"]}
if not compatible:
    raise RuntimeError("No available iOS 26 simulator runtime for the selected release SDK")
devices = json.loads(run("xcrun", "simctl", "list", "devices", "available", "--json"))["devices"]
phone = next(
    device
    for runtime in sorted(devices, reverse=True)
    for device in devices[runtime]
    if runtime in compatible and device["name"].startswith("iPhone") and device["isAvailable"]
)
udid = phone["udid"]
print(f"Native smoke device: {phone['name']} ({udid})", flush=True)
if phone["state"] != "Booted":
    run("xcrun", "simctl", "boot", udid)
run("xcrun", "simctl", "bootstatus", udid, "-b", timeout=240)
app = Path("build/Build/Products/Debug-iphonesimulator/App.app")
if not app.is_dir():
    raise RuntimeError(f"Missing compiled app: {app}")
run("xcrun", "simctl", "install", udid, str(app))
print(run("xcrun", "simctl", "launch", udid, "com.moonsquad.hollowrealm"), flush=True)
time.sleep(15)
evidence = Path("native-evidence")
evidence.mkdir(exist_ok=True)
run("xcrun", "simctl", "io", udid, "screenshot", str(evidence / "launch.png"))
run("sips", "-s", "format", "jpeg", "-Z", "1100", str(evidence / "launch.png"), "--out", str(evidence / "launch.jpg"))
print("NATIVE_EVIDENCE:launch:" + base64.b64encode((evidence / "launch.jpg").read_bytes()).decode(), flush=True)
# Termination succeeds only if the app is still running after startup.
run("xcrun", "simctl", "terminate", udid, "com.moonsquad.hollowrealm")
print("Native app installed, launched, remained running and produced a screenshot.")
