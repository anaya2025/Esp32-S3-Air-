#pragma once
#include "esp_err.h"
#include "hal/i2s_types.h"
#include <driver/gpio.h>

typedef struct {
    gpio_num_t bclk_io_num;
    gpio_num_t wclk_io_num;
    gpio_num_t din_io_num;
    uint32_t sample_rate;
    i2s_data_bit_width_t bit_depth;
    uint32_t dma_desc_num;
    uint32_t dma_frame_num;
} uda1334a_config_t;

esp_err_t i2s_uda1334a_init(const uda1334a_config_t *config);
esp_err_t i2s_uda1334a_write(const void *src, size_t size, size_t *bytes_written, TickType_t ticks_to_wait);
esp_err_t i2s_uda1334a_set_clock(uint32_t sample_rate, i2s_data_bit_width_t bit_width);
