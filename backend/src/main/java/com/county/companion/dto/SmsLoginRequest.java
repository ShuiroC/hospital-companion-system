package com.county.companion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SmsLoginRequest(
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^1\\d{10}$", message = "Phone format is invalid")
        String phone,

        @NotBlank(message = "Code is required")
        String code
) {
}