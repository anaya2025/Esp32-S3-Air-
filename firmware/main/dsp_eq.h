#pragma once
#include <stdint.h>
#include <stddef.h>

void dsp_eq_init(void);
void dsp_eq_set_bands(float bass_db, float mid_db, float treble_db);
void dsp_eq_process_pcm16(int16_t *samples, size_t count);
