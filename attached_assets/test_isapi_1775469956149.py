import requests
from requests.auth import HTTPDigestAuth
import os
from dotenv import load_dotenv

load_dotenv()

RTSP_USERNAME = os.environ.get("RTSP_USERNAME")
RTSP_PASSWORD = os.environ.get("RTSP_PASSWORD")
RTSP_HOST = os.environ.get("RTSP_HOST")

# Common ISAPI port is 80 or 8000
ISAPI_URL = f"http://{RTSP_HOST}/ISAPI/System/Video/inputs/channels"

try:
    print(f"Attempting to fetch camera names from {ISAPI_URL}...")
    # Disable SSL verification for local/dyndns DVRs
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    response = requests.get(ISAPI_URL, auth=HTTPDigestAuth(RTSP_USERNAME, RTSP_PASSWORD), timeout=5, verify=False)
    
    if response.status_code == 200:
        print("SUCCESS! DVR is reachable via ISAPI.")
        print(response.text[:500]) # Print first 500 chars of XML
    else:
        print(f"FAILED: DVR returned status code {response.status_code}")
except Exception as e:
    print(f"ERROR: Could not connect to DVR via ISAPI: {e}")
