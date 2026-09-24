"""Install and launch the actual bundled iOS app; preserve visual evidence."""
import base64
import json
from pathlib import Path
import subprocess
import tempfile
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
evidence = Path("native-evidence")
evidence.mkdir(exist_ok=True)
# Process survival alone accepted a blank WebView in run 35953692350.
# Use macOS Vision to verify actual title/entry text in the simulator capture.
# https://developer.apple.com/documentation/vision/recognizing-text-in-images
with tempfile.TemporaryDirectory(prefix="hollow-screen-") as work:
    source = Path(work) / "recognize.swift"
    binary = Path(work) / "recognize"
    source.write_text('''import Foundation
import Vision
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["en-US"]
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]))
try handler.perform([request])
for observation in request.results ?? [] {
    if let candidate = observation.topCandidates(1).first {
        print(candidate.string)
    }
}
''')
    run("xcrun", "swiftc", str(source), "-o", str(binary))
    print(run("xcrun", "simctl", "launch", udid, "com.moonsquad.hollowrealm"), flush=True)
    started = time.monotonic()
    ready = False
    for attempt in range(1, 19):
        time.sleep(5)
        capture = evidence / f"startup-{attempt:02d}.png"
        run("xcrun", "simctl", "io", udid, "screenshot", str(capture))
        text = run(str(binary), str(capture), timeout=30)
        (evidence / f"startup-{attempt:02d}.txt").write_text(text)
        normalized = " ".join(text.lower().split())
        ready = all(label in normalized for label in ("hollow", "realm", "wake in vault 13"))
        (evidence / "launch.png").write_bytes(capture.read_bytes())
        print(f"Native screen attempt {attempt}: ready={ready}, elapsed={time.monotonic() - started:.1f}s", flush=True)
        if ready or time.monotonic() - started >= 90:
            break
run("sips", "-s", "format", "jpeg", "-Z", "1100", str(evidence / "launch.png"), "--out", str(evidence / "launch.jpg"))
print("NATIVE_EVIDENCE:launch:" + base64.b64encode((evidence / "launch.jpg").read_bytes()).decode(), flush=True)
# Termination succeeds only if the app is still running after startup.
run("xcrun", "simctl", "terminate", udid, "com.moonsquad.hollowrealm")
if not ready:
    raise RuntimeError("Native app stayed blank or never displayed the Hollow Realm title and Vault 13 entry within 90 seconds; inspect native-evidence.")
print("Native app installed, launched, displayed the title and Vault 13 entry, and remained running.")
