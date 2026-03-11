package com.county.companion.controller;

import com.county.companion.common.ApiResponse;
import com.county.companion.dto.CreateOrderRequest;
import com.county.companion.dto.OrderPageResult;
import com.county.companion.entity.OrderEntity;
import com.county.companion.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ApiResponse<List<OrderEntity>> list(
            @RequestParam(required = false) String patientPhone,
            @RequestParam(required = false) String companionPhone
    ) {
        return ApiResponse.success(orderService.list(patientPhone, companionPhone));
    }

    @GetMapping("/query")
    public ApiResponse<OrderPageResult> query(
            @RequestParam(required = false) String patientPhone,
            @RequestParam(required = false) String companionPhone,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String hospital,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        return ApiResponse.success(orderService.query(
                patientPhone,
                companionPhone,
                orderNo,
                hospital,
                username,
                status,
                page == null ? 1 : page,
                pageSize == null ? 10 : pageSize
        ));
    }

    @GetMapping("/{orderNo}")
    public ApiResponse<OrderEntity> detail(@PathVariable String orderNo) {
        return ApiResponse.success(orderService.detail(orderNo));
    }

    @PostMapping
    public ApiResponse<OrderEntity> create(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestParam(required = false) String patientPhone
    ) {
        return ApiResponse.success("Order created", orderService.create(request, patientPhone));
    }

    @PutMapping("/{orderNo}/next")
    public ApiResponse<OrderEntity> next(@PathVariable String orderNo) {
        return ApiResponse.success("Order status advanced", orderService.advance(orderNo));
    }

    @PutMapping("/{orderNo}/accept")
    public ApiResponse<OrderEntity> accept(
            @PathVariable String orderNo,
            @RequestParam String companionPhone
    ) {
        return ApiResponse.success("Order accepted", orderService.accept(orderNo, companionPhone));
    }

    @PutMapping("/{orderNo}/pay")
    public ApiResponse<OrderEntity> pay(@PathVariable String orderNo) {
        return ApiResponse.success("Order paid", orderService.pay(orderNo));
    }

    @PutMapping("/{orderNo}/cancel")
    public ApiResponse<OrderEntity> cancel(@PathVariable String orderNo) {
        return ApiResponse.success("Order canceled", orderService.cancel(orderNo));
    }

    @DeleteMapping("/{orderNo}")
    public ApiResponse<Void> delete(@PathVariable String orderNo) {
        orderService.delete(orderNo);
        return ApiResponse.success("Order deleted", null);
    }
}