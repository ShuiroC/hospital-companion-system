package com.county.companion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(max = 20, message = "Username max length is 20")
        String username,

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^1\\d{10}$", message = "Phone format is invalid")
        String phone,

        @NotBlank(message = "Password is required")
        String password,

        Integer age,

        @Size(max = 30, message = "Education max length is 30")
        String education,

        Integer workYears,

        Integer role
) {
}
