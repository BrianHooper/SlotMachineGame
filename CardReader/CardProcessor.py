import serial
import json
from pathlib import Path
import os
import requests
from urllib3.exceptions import InsecureRequestWarning
import time

requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

def IsValidSerialPort(port: str, baudrate: int) -> bool:
    try:
        s = serial.Serial(port=port, baudrate=baudrate)
        s.close()
        if s is not None and type(s) is serial.serialwin32.Serial:
            return True
    except (OSError, serial.SerialException):
        pass
    return False

def GetSerialPort(baudrate: int) -> str | None:
    print("Scanning COM ports")
    ports = ["COM%s" % (i + 1) for i in range(256)]
    for port in ports:
        if IsValidSerialPort(port, baudrate):
            print(f"Found COM port {[port]}")
            return port
    print("No COM port found")
    return None

def SendKey(key):
    try:
        url = "https://localhost:7135/Home/SetPlayer"
        data = {"player": key}
        req = requests.post(url, json=data, verify=False)
        print(f"Sent: {req.status_code}")
    except Exception as e:
        print(f"API Exception: {e.__class__.__name__}")

def GetCachePath():
    localAppData = Path(os.getenv("LOCALAPPDATA"))
    return localAppData / "SlotMachineGame" / "RfidCache.json"

def ReadCache():
    cachePath = GetCachePath()
    if not os.path.exists(cachePath):
        return {}
    
    try:
        with open(cachePath, "r", encoding="utf-8") as infile:
            cacheData = json.load(infile)
            return cacheData
    except Exception:
        return {}
    
def AddToCache(key):
    cachePath = GetCachePath()
    cacheData = ReadCache()
    if "Keys" not in cacheData:
        cacheData["Keys"] = []

    keys = cacheData["Keys"]
    keys.append(key)
    keys = list(set(keys))
    cacheData["Keys"] = keys
    with open(cachePath, "w", encoding="utf-8") as outfile:
        json.dump(cacheData, outfile, indent=4)

def SendData(encodedData: bytes) -> None:
    if encodedData is None or len(encodedData) == 0:
        return
    data = encodedData.decode().strip()
    if "TAG: " not in data:
        return
    
    key = data[6:]
    AddToCache(key)
    print(f"\"{key}\"")
    SendKey(key)

def ReadSerial(serialConnection: serial.Serial) -> bool:
    try:
        data = serialConnection.readline()
    except Exception as e:
        print(f"Serial Exception: {e.__class__.__name__}")
        return False
    
    SendData(data)
    return True
        

def ReadCardsLoop(comport: str | None, baudrate: int) -> None:
    if comport is None or len(comport) == 0:
        return
    
    # 1/timeout is the frequency at which the port is read
    serialConnection = serial.Serial(comport, baudrate, timeout=0.1)

    run = True
    while run:
        run = ReadSerial(serialConnection)

def Main():
    baudRate = 9600
    while True:
        port = GetSerialPort(baudRate)
        ReadCardsLoop(port, baudRate)
        time.sleep(5)

if __name__ == "__main__":
    Main()