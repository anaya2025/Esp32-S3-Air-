#pragma once
#include "esp_err.h"
#include <stddef.h>

esp_err_t ota_begin_update(void);
esp_err_t ota_write_chunk(const void *data, size_t length);
esp_err_t ota_finalize_and_switch(void);
