package com.county.companion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePhoneRequest(
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^1\\d{10}$", message = "Phone format is invalid")
        String phone,

        Integer role,

        @NotBlank(message = "New phone is required")
        @Pattern(regexp = "^1\\d{10}$", message = "New phone format is invalid")
        String newPhone
) {
}
