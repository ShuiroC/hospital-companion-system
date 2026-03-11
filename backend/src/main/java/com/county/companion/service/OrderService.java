package com.county.companion.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.county.companion.dto.CreateOrderRequest;
import com.county.companion.dto.OrderPageResult;
import com.county.companion.entity.HospitalEntity;
import com.county.companion.entity.OrderEntity;
import com.county.companion.entity.OrderRecordEntity;
import com.county.companion.entity.UserEntity;
import com.county.companion.mapper.HospitalMapper;
import com.county.companion.mapper.OrderMapper;
import com.county.companion.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class OrderService {

    private static final DateTimeFormatter VIEW_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter CREATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int ROLE_PATIENT = 1;
    private static final int ROLE_COMPANION = 3;

    private static final Map<Integer, String> STATUS_TO_VIEW = Map.of(
            0, "UNPAID",
            1, "WAITING_ACCEPT",
            2, "ACCEPTED",
            3, "IN_SERVICE",
            4, "TO_CONFIRM",
            5, "COMPLETED",
            6, "CANCELED",
            7, "REFUNDING",
            8, "REFUNDED"
    );

    private static final Map<Integer, Integer> NEXT_FLOW = Map.of(
            0, 1,
            2, 3,
            3, 4,
            4, 5
    );

    private static final Map<String, Integer> SERVICE_TO_CODE = Map.of(
            "全程陪诊", 1,
            "检查陪同", 2,
            "乡镇接送", 3
    );

    private static final Map<Integer, String> CODE_TO_SERVICE = Map.of(
            1, "全程陪诊",
            2, "检查陪同",
            3, "乡镇接送"
    );

    private final OrderMapper orderMapper;
    private final HospitalMapper hospitalMapper;
    private final UserMapper userMapper;

    public OrderService(OrderMapper orderMapper, HospitalMapper hospitalMapper, UserMapper userMapper) {
        this.orderMapper = orderMapper;
        this.hospitalMapper = hospitalMapper;
        this.userMapper = userMapper;
    }

    public List<OrderEntity> list(String patientPhone, String companionPhone) {
        LambdaQueryWrapper<OrderRecordEntity> query = new LambdaQueryWrapper<OrderRecordEntity>()
                .orderByDesc(OrderRecordEntity::getId);

        if (patientPhone != null && !patientPhone.isBlank()) {
            UserEntity patient = findUserByPhoneRole(patientPhone, ROLE_PATIENT);
            if (patient == null) {
                return List.of();
            }
            query.and(q -> q
                    .eq(OrderRecordEntity::getUserId, patient.getId())
                    .or(inner -> inner
                            .isNull(OrderRecordEntity::getUserId)
                            .eq(OrderRecordEntity::getPatientPhone, patientPhone)));
        }

        if (companionPhone != null && !companionPhone.isBlank()) {
            UserEntity companion = findUserByPhoneRole(companionPhone, ROLE_COMPANION);
            if (companion == null) {
                return List.of();
            }
            query.eq(OrderRecordEntity::getCompanionId, companion.getId());
        }

        List<OrderRecordEntity> records = orderMapper.selectList(query);
        return mapToView(records);
    }

    public OrderPageResult query(
            String patientPhone,
            String companionPhone,
            String orderNo,
            String hospital,
            String username,
            String status,
            int page,
            int pageSize
    ) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, Math.min(100, pageSize));

        String orderNoText = normalizeText(orderNo);
        String hospitalText = normalizeText(hospital);
        String usernameText = normalizeText(username);
        Set<String> statuses = normalizeStatusSet(status);

        List<OrderEntity> filtered = list(patientPhone, companionPhone).stream()
                .filter(item -> matchesText(item.getOrderNo(), orderNoText))
                .filter(item -> matchesText(item.getHospital(), hospitalText))
                .filter(item -> matchesText(item.getPatientUsername(), usernameText)
                        || matchesText(item.getPatientName(), usernameText))
                .filter(item -> statuses.isEmpty() || statuses.contains(normalizeText(item.getStatus()).toUpperCase(Locale.ROOT)))
                .toList();

        int total = filtered.size();
        int start = (safePage - 1) * safePageSize;
        if (start >= total) {
            return new OrderPageResult(List.of(), total, safePage, safePageSize);
        }

        int end = Math.min(total, start + safePageSize);
        return new OrderPageResult(filtered.subList(start, end), total, safePage, safePageSize);
    }

    public OrderEntity detail(String orderNo) {
        OrderRecordEntity record = getByOrderNo(orderNo);
        return toView(record, findHospitalName(record.getHospitalId()), findPatientUsername(record.getUserId()));
    }

    public OrderEntity create(CreateOrderRequest req, String patientPhone) {
        HospitalEntity hospital = resolveHospital(req.hospital());
        if (hospital == null) {
            throw new IllegalArgumentException("Hospital not found");
        }

        Integer serviceCode = resolveServiceType(req.serviceType());
        if (serviceCode == null) {
            throw new IllegalArgumentException("Unsupported service type");
        }

        LocalDateTime reserveTime = LocalDateTime.parse(req.reserveTime(), VIEW_TIME_FORMATTER);
        String creatorPhone = patientPhone != null && !patientPhone.isBlank() ? patientPhone : req.patientPhone();
        UserEntity patient = findUserByPhoneRole(creatorPhone, ROLE_PATIENT);
        if (patient == null) {
            throw new IllegalArgumentException("Patient account not found");
        }

        OrderRecordEntity record = new OrderRecordEntity();
        record.setOrderNo("OD" + System.currentTimeMillis());
        record.setUserId(patient.getId());
        record.setHospitalId(hospital.getId());
        record.setServiceType(serviceCode);
        record.setStatus(0);
        record.setAmount(BigDecimal.valueOf(req.amount()));
        record.setPayStatus(0);
        record.setReserveTime(reserveTime);
        record.setPatientName(req.patientName());
        record.setPatientPhone(req.patientPhone());
        record.setCreateTime(LocalDateTime.now());
        orderMapper.insert(record);

        return toView(record, hospital.getName(), patient.getUsername());
    }

    public OrderEntity advance(String orderNo) {
        OrderRecordEntity record = getByOrderNo(orderNo);
        Integer next = NEXT_FLOW.get(record.getStatus());
        if (next == null) {
            throw new IllegalArgumentException("Current status cannot be advanced");
        }

        orderMapper.update(null, new LambdaUpdateWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getId, record.getId())
                .set(OrderRecordEntity::getStatus, next));
        record.setStatus(next);
        return toView(record, findHospitalName(record.getHospitalId()), findPatientUsername(record.getUserId()));
    }

    public OrderEntity accept(String orderNo, String companionPhone) {
        if (companionPhone == null || companionPhone.isBlank()) {
            throw new IllegalArgumentException("Companion phone is required");
        }

        UserEntity companion = findUserByPhoneRole(companionPhone, ROLE_COMPANION);
        if (companion == null) {
            throw new IllegalArgumentException("Companion account not found");
        }

        OrderRecordEntity record = getByOrderNo(orderNo);
        if (record.getStatus() == null || record.getStatus() != 1) {
            throw new IllegalArgumentException("Only waiting orders can be accepted");
        }

        int updated = orderMapper.update(null, new LambdaUpdateWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getId, record.getId())
                .eq(OrderRecordEntity::getStatus, 1)
                .set(OrderRecordEntity::getStatus, 2)
                .set(OrderRecordEntity::getCompanionId, companion.getId()));

        if (updated == 0) {
            throw new IllegalArgumentException("Order has been accepted by another companion");
        }

        record.setStatus(2);
        record.setCompanionId(companion.getId());
        return toView(record, findHospitalName(record.getHospitalId()), findPatientUsername(record.getUserId()));
    }

    public OrderEntity pay(String orderNo) {
        OrderRecordEntity record = getByOrderNo(orderNo);
        if (record.getStatus() == null || record.getStatus() != 0) {
            throw new IllegalArgumentException("Only unpaid orders can be paid");
        }

        orderMapper.update(null, new LambdaUpdateWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getId, record.getId())
                .set(OrderRecordEntity::getStatus, 1)
                .set(OrderRecordEntity::getPayStatus, 1));

        record.setStatus(1);
        record.setPayStatus(1);
        return toView(record, findHospitalName(record.getHospitalId()), findPatientUsername(record.getUserId()));
    }

    public OrderEntity cancel(String orderNo) {
        OrderRecordEntity record = getByOrderNo(orderNo);
        if (record.getStatus() != null && record.getStatus() == 5) {
            throw new IllegalArgumentException("Completed order cannot be canceled");
        }

        orderMapper.update(null, new LambdaUpdateWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getId, record.getId())
                .set(OrderRecordEntity::getStatus, 6));

        record.setStatus(6);
        return toView(record, findHospitalName(record.getHospitalId()), findPatientUsername(record.getUserId()));
    }

    public void delete(String orderNo) {
        int rows = orderMapper.delete(new LambdaQueryWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getOrderNo, orderNo));
        if (rows == 0) {
            throw new IllegalArgumentException("Order not found");
        }
    }

    private String normalizeText(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private boolean matchesText(String source, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        return normalizeText(source).toLowerCase(Locale.ROOT)
                .contains(keyword.toLowerCase(Locale.ROOT));
    }

    private Set<String> normalizeStatusSet(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return Set.of();
        }
        String[] parts = rawStatus.split(",");
        Set<String> result = new HashSet<>();
        for (String part : parts) {
            String normalized = normalizeText(part).toUpperCase(Locale.ROOT);
            if (!normalized.isEmpty()) {
                result.add(normalized);
            }
        }
        return result;
    }

    private HospitalEntity resolveHospital(String rawHospital) {
        if (rawHospital == null || rawHospital.isBlank()) {
            return null;
        }
        if (rawHospital.chars().allMatch(Character::isDigit)) {
            return hospitalMapper.selectById(Long.parseLong(rawHospital));
        }
        return hospitalMapper.selectOne(new LambdaQueryWrapper<HospitalEntity>()
                .eq(HospitalEntity::getName, rawHospital)
                .last("limit 1"));
    }

    private Integer resolveServiceType(String rawServiceType) {
        if (rawServiceType == null || rawServiceType.isBlank()) {
            return null;
        }

        String text = rawServiceType.trim();
        if (text.chars().allMatch(Character::isDigit)) {
            int code = Integer.parseInt(text);
            return CODE_TO_SERVICE.containsKey(code) ? code : null;
        }

        return SERVICE_TO_CODE.get(text);
    }

    private OrderRecordEntity getByOrderNo(String orderNo) {
        OrderRecordEntity record = orderMapper.selectOne(new LambdaQueryWrapper<OrderRecordEntity>()
                .eq(OrderRecordEntity::getOrderNo, orderNo)
                .last("limit 1"));
        if (record == null) {
            throw new IllegalArgumentException("Order not found");
        }
        return record;
    }

    private UserEntity findUserByPhoneRole(String phone, int role) {
        return userMapper.selectOne(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getPhone, phone)
                .eq(UserEntity::getRole, role)
                .last("limit 1"));
    }

    private List<OrderEntity> mapToView(List<OrderRecordEntity> records) {
        if (records.isEmpty()) {
            return List.of();
        }

        Map<Long, String> hospitalNames = new HashMap<>();
        Map<Long, String> userNames = new HashMap<>();
        List<Long> hospitalIds = new ArrayList<>();
        List<Long> userIds = new ArrayList<>();

        for (OrderRecordEntity record : records) {
            if (record.getHospitalId() != null && !hospitalIds.contains(record.getHospitalId())) {
                hospitalIds.add(record.getHospitalId());
            }
            if (record.getUserId() != null && !userIds.contains(record.getUserId())) {
                userIds.add(record.getUserId());
            }
        }

        if (!hospitalIds.isEmpty()) {
            List<HospitalEntity> hospitals = hospitalMapper.selectList(new LambdaQueryWrapper<HospitalEntity>()
                    .in(HospitalEntity::getId, hospitalIds));
            for (HospitalEntity hospital : hospitals) {
                hospitalNames.put(hospital.getId(), hospital.getName());
            }
        }

        if (!userIds.isEmpty()) {
            List<UserEntity> users = userMapper.selectList(new LambdaQueryWrapper<UserEntity>()
                    .in(UserEntity::getId, userIds));
            for (UserEntity user : users) {
                userNames.put(user.getId(), user.getUsername());
            }
        }

        List<OrderEntity> result = new ArrayList<>();
        for (OrderRecordEntity record : records) {
            result.add(toView(
                    record,
                    hospitalNames.getOrDefault(record.getHospitalId(), ""),
                    record.getUserId() == null ? "" : userNames.getOrDefault(record.getUserId(), "")
            ));
        }
        return result;
    }

    private String findHospitalName(Long hospitalId) {
        if (hospitalId == null) {
            return "";
        }
        HospitalEntity hospital = hospitalMapper.selectById(hospitalId);
        return hospital == null ? "" : hospital.getName();
    }

    private String findPatientUsername(Long userId) {
        if (userId == null) {
            return "";
        }
        UserEntity patient = userMapper.selectById(userId);
        return patient == null ? "" : patient.getUsername();
    }

    private OrderEntity toView(OrderRecordEntity record, String hospitalName, String patientUsername) {
        OrderEntity view = new OrderEntity();
        view.setOrderNo(record.getOrderNo());
        view.setHospital(hospitalName);
        view.setServiceType(CODE_TO_SERVICE.getOrDefault(record.getServiceType(), "未知服务"));
        view.setStatus(STATUS_TO_VIEW.getOrDefault(record.getStatus(), "UNKNOWN"));
        view.setAmount(record.getAmount() == null ? 0D : record.getAmount().doubleValue());
        view.setReserveTime(record.getReserveTime() == null ? "" : record.getReserveTime().format(VIEW_TIME_FORMATTER));
        view.setPatientUsername(patientUsername == null ? "" : patientUsername);
        view.setPatientName(record.getPatientName());
        view.setPatientPhone(record.getPatientPhone());
        view.setCreateTime(record.getCreateTime() == null ? "" : record.getCreateTime().format(CREATE_TIME_FORMATTER));
        return view;
    }
}