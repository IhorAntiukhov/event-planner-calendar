#include <Arduino.h>
#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>

#include "AsyncJson.h"
#include "ArduinoJson.h"

AsyncWebServer server(80);

const char* PARAM_MESSAGE = "message";

void notFound(AsyncWebServerRequest *request) {
  request->send(404, "text/plain", "Not found");
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_AP);
  WiFi.softAP("ESP", "");
  
  server.on("/get-events", HTTP_GET, [](AsyncWebServerRequest * request) {
    Serial.println("PIZDANUTSIA");
    request->send(200, "text/plain", "OK");
  });

  AsyncCallbackJsonWebHandler *handler = new AsyncCallbackJsonWebHandler("/save-events", [](AsyncWebServerRequest * request, JsonVariant & json) {
    Serial.println("SUKIN XUI");
    DynamicJsonDocument eventsJSON(1024);
    if (json.is<JsonArray>()) {
      eventsJSON = json.as<JsonArray>();
    } else if (json.is<JsonObject>()) {
      eventsJSON = json.as<JsonObject>();
    }
    
    String eventsString;
    deserializeJson(eventsJSON, eventsString);
    request->send(200, "text/plain", "OK");
    Serial.println(eventsString);
  });
  
  server.addHandler(handler);
  server.onNotFound(notFound);

  server.begin();
}

void loop() {}
