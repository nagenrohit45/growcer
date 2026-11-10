package com.growcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {
    private final ObjectMapper json;
    private final JsonNode catalog;
    private final Map<Integer, JsonNode> products = new LinkedHashMap<>();

    public CatalogService(ObjectMapper json) throws Exception {
        this.json = json;
        try (var input = new ClassPathResource("catalog.json").getInputStream()) { catalog = json.readTree(input); }
        for (JsonNode product : catalog.path("products")) products.put(product.path("id").asInt(), product);
    }

    public JsonNode catalog() { return catalog.deepCopy(); }

    public ObjectNode price(JsonNode items, String coupon) {
        if (items == null || !items.isArray() || items.isEmpty() || items.size() > 50) {
            throw new ApiException(400, "Add at least one product to your cart.");
        }
        if (coupon == null || (!coupon.isEmpty() && !java.util.Set.of("SAVE10", "FLAT50", "FREESHIP", "VEG20").contains(coupon))) {
            throw new ApiException(400, "This coupon is not valid.");
        }
        Map<Integer, Integer> quantities = new LinkedHashMap<>();
        for (JsonNode item : items) {
            JsonNode idNode = item.path("id");
            int id;
            try { id = new BigDecimal(idNode.asText()).intValueExact(); }
            catch (Exception exception) { throw new ApiException(400, "Your cart contains an invalid product or quantity."); }
            JsonNode quantity = item.path("quantity");
            if (!products.containsKey(id) || !quantity.isNumber() || quantity.decimalValue().stripTrailingZeros().scale() > 0
                    || quantity.decimalValue().compareTo(BigDecimal.ONE) < 0 || quantity.decimalValue().compareTo(BigDecimal.valueOf(99)) > 0) {
                throw new ApiException(400, "Your cart contains an invalid product or quantity.");
            }
            int count = quantities.getOrDefault(id, 0) + quantity.intValue();
            if (count > 99) throw new ApiException(400, "A product can have at most 99 units.");
            quantities.put(id, count);
        }
        ObjectNode result = json.createObjectNode();
        var lines = result.putArray("items");
        BigDecimal subtotal = BigDecimal.ZERO, vegetables = BigDecimal.ZERO;
        for (var entry : quantities.entrySet()) {
            JsonNode product = products.get(entry.getKey());
            BigDecimal amount = product.path("price").decimalValue().multiply(BigDecimal.valueOf(entry.getValue()));
            ObjectNode line = lines.addObject();
            for (String field : new String[]{"id", "name", "price", "unit", "category"}) line.set(field, product.get(field));
            line.put("quantity", entry.getValue()); line.put("lineTotal", amount);
            subtotal = subtotal.add(amount);
            if (product.path("category").asText().equals("vegetables")) vegetables = vegetables.add(amount);
        }
        BigDecimal raw = switch (coupon) {
            case "SAVE10" -> subtotal.multiply(new BigDecimal("0.10"));
            case "FLAT50" -> BigDecimal.valueOf(50);
            case "FREESHIP" -> BigDecimal.valueOf(30);
            case "VEG20" -> vegetables.multiply(new BigDecimal("0.20"));
            default -> BigDecimal.ZERO;
        };
        BigDecimal discount = raw.setScale(2, RoundingMode.HALF_UP).min(subtotal);
        result.put("subtotal", subtotal); result.put("discount", discount);
        result.put("total", subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP)); result.put("coupon", coupon);
        return result;
    }

    public ObjectNode delivery(JsonNode input) {
        ObjectNode result = json.createObjectNode();
        String[] fields = {"name", "address", "city"};
        int[] min = {2, 8, 2}, max = {100, 300, 100};
        for (int i = 0; i < fields.length; i++) {
            String field = fields[i];
            String value = text(input, field).strip();
            if (value.length() < min[i] || value.length() > max[i]) {
                throw new ApiException(400, "Please enter a valid " + field + " (" + min[i] + "–" + max[i] + " characters).");
            }
            result.put(field, value);
        }
        String phone = text(input, "phone").replaceAll("[\\s()-]", "");
        if (!phone.matches("\\+?[0-9]{10,15}")) throw new ApiException(400, "Enter a valid phone number with 10–15 digits.");
        result.put("phone", phone);
        return result;
    }

    public static String text(JsonNode body, String key) {
        return body != null && body.path(key).isTextual() ? body.path(key).asText() : "";
    }
}
