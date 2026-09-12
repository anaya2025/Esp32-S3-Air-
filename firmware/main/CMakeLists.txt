idf_component_register(
    SRCS "main.c" "i2s_uda1334a.c" "dsp_eq.c" "ota_handler.c"
    INCLUDE_DIRS "."
    REQUIRES esp_wifi esp_netif esp_event nvs_flash esp_http_server mdns esp_driver_i2s esp_ota app_update
)
