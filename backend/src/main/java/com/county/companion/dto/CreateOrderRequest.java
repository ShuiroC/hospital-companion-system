package com.county.companion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateOrderRequest(
        @NotBlank(message = "Hospital is required")
        String hospital,

        @NotBlank(message = "Service type is required")
        String serviceType,

        @NotBlank(message = "Reserve time is required")
        String reserveTime,

        @NotBlank(message = "Patient name is required")
        String patientName,

        @NotBlank(message = "Patient phone is required")
        @Pattern(regexp = "^\\d{11}$", message = "Patient phone must be exactly 11 digits")
        String patientPhone,

        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        Double amount
) {
}
