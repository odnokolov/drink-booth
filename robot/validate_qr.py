"""
Скрипт для PC/робота:
- Читает QR-код с камеры (или вводит токен вручную)
- Валидирует через Airtable и отмечает как использованный
- Выводит команду: какой напиток налить

Зависимости:
  pip install opencv-python pyzbar requests python-dotenv

Запуск:
  python validate_qr.py
"""

import os
import sys
import time
import requests
from urllib.parse import unquote
from dotenv import load_dotenv

load_dotenv()

BASE_ID   = os.getenv("AIRTABLE_BASE_ID")
API_KEY   = os.getenv("AIRTABLE_API_KEY")
TABLE     = os.getenv("AIRTABLE_TABLE", "Contacts")
BASE_URL  = f"https://api.airtable.com/v0/{BASE_ID}/{requests.utils.quote(TABLE)}"
HEADERS   = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Drink → relay pin mapping (настрой под свою схему)
DRINK_PINS = {
    "coffee": 17,
    "tea":    18,
    "juice":  27,
    "water":  22,
}

def validate_and_consume(token: str) -> dict | None:
    """Находит запись по токену, проверяет что не использована, помечает как used."""
    safe_token = token.replace("\\", "\\\\").replace('"', '\\"')
    formula = f'Token="{safe_token}"'
    res = requests.get(BASE_URL, headers=HEADERS, params={"filterByFormula": formula})
    res.raise_for_status()
    records = res.json().get("records", [])

    if not records:
        return None

    record = records[0]
    fields = record["fields"]

    if fields.get("Used"):
        return None  # уже использован

    # Пометить как использованный
    patch = requests.patch(
        f"{BASE_URL}/{record['id']}",
        headers=HEADERS,
        json={"fields": {"Used": True}},
    )
    patch.raise_for_status()
    return {"name": fields.get("Name"), "drink": fields.get("Drink")}


def pour_drink(drink: str):
    """Заглушка — замени на реальное управление реле/мотором."""
    print(f"  ▶ Наливаем: {drink}")
    pin = DRINK_PINS.get(drink)
    if pin:
        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.HIGH)
            time.sleep(3)  # секунды налива
            GPIO.output(pin, GPIO.LOW)
            GPIO.cleanup()
        except ImportError:
            print("  (RPi.GPIO не найден — режим симуляции)")
            time.sleep(1)


def parse_qr(data: str) -> dict | None:
    """Парсит строку QR-кода.
    Форматы:
      DRINKBOT:<token>:<drink>:<name_urlencoded>  — токен, напиток, имя (percent-encoding)
      DRINKBOT:<token>:<drink>  — токен + напиток
      DRINKBOT:<token>          — только токен
    Возвращает {'token', 'drink', 'name'} или None.
    """
    if not data.startswith("DRINKBOT:"):
        return None
    rest = data[len("DRINKBOT:"):]
    parts = rest.split(":", 2)
    token = parts[0]
    drink = parts[1] if len(parts) > 1 else None
    name_enc = parts[2] if len(parts) > 2 else None
    name = unquote(name_enc) if name_enc else None
    return {"token": token, "drink": drink, "name": name}


def scan_qr_from_camera() -> dict | None:
    """Сканирует QR через камеру, возвращает {'token', 'drink', 'name'}."""
    try:
        import cv2
        from pyzbar.pyzbar import decode
    except ImportError:
        print("  ⚠  opencv / pyzbar не установлены. Введи токен вручную.")
        return None

    print("  📷 Открываю камеру... (нажми Q чтобы выйти)")
    cap = cv2.VideoCapture(0)
    result = None
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        for code in decode(frame):
            data = code.data.decode("utf-8")
            parsed = parse_qr(data)
            if parsed:
                result = parsed
                break
        if result:
            break
        cv2.imshow("QR Scanner — нажми Q чтобы выйти", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()
    return result


def main():
    print("=" * 45)
    print("  🤖 Drink Bot — Валидатор QR-кодов")
    print("=" * 45)

    while True:
        print("\nОжидаю QR-код... (или нажми Enter для ввода вручную)")
        qr = scan_qr_from_camera()
        if qr is None:
            raw = input("  Введи QR-строку или токен: ").strip()
            qr = parse_qr(raw) or {"token": raw, "drink": None, "name": None}

        if not qr.get("token"):
            continue

        token = qr["token"]
        drink_from_qr = qr.get("drink")
        name_from_qr = qr.get("name")

        print(f"  Токен: {token}")
        if drink_from_qr:
            print(f"  Напиток из QR: {drink_from_qr}")
        if name_from_qr:
            print(f"  Имя из QR: {name_from_qr}")
        print("  Проверяю через Airtable...")

        try:
            result = validate_and_consume(token)
        except Exception as e:
            print(f"  ⚠  Airtable недоступен: {e}")
            print("  ❌ Напиток не выдан — нет соединения с Airtable. Проверьте сеть.")
            continue

        if result is None:
            print("  ❌ Токен недействителен или уже использован")
        else:
            drink = result.get("drink") or drink_from_qr
            who = result.get("name") or name_from_qr or "гость"
            print(f"  ✅ Привет, {who}! Напиток: {drink}")
            pour_drink(drink)
            print("  ✅ Готово! Напиток налит.")

        time.sleep(2)


if __name__ == "__main__":
    main()
