package com.growcer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class CatalogServiceTest {
    final ObjectMapper json = new ObjectMapper();
    final CatalogService service;
    CatalogServiceTest() throws Exception { service = new CatalogService(json); }

    @Test void capsEveryFixedDiscountAtBasketValue() throws Exception {
        for (String coupon : new String[]{"FLAT50", "FREESHIP"}) {
            var priced = service.price(json.readTree("[{\"id\":19,\"quantity\":1}]"), coupon);
            assertThat(priced.path("total").decimalValue()).isEqualByComparingTo("0");
            assertThat(priced.path("discount").decimalValue()).isEqualByComparingTo("20");
        }
    }
    @Test void vegetableCouponDoesNotDiscountFruit() throws Exception {
        var priced = service.price(json.readTree("[{\"id\":1,\"quantity\":2},{\"id\":6,\"quantity\":1}]"), "VEG20");
        assertThat(priced.path("discount").decimalValue()).isEqualByComparingTo("16");
        assertThat(priced.path("total").decimalValue()).isEqualByComparingTo("184");
        assertThat(service.price(json.readTree("[{\"id\":6,\"quantity\":1}]"), "VEG20").path("discount").decimalValue()).isEqualByComparingTo("0");
    }
    @Test void mergesDuplicateLinesAndCalculatesDecimalTotals() throws Exception {
        var priced = service.price(json.readTree("[{\"id\":3,\"quantity\":1},{\"id\":3,\"quantity\":2}]"), "SAVE10");
        assertThat(priced.path("items").size()).isEqualTo(1);
        assertThat(priced.path("items").get(0).path("quantity").asInt()).isEqualTo(3);
        assertThat(priced.path("total").decimalValue()).isEqualByComparingTo("94.50");
    }
    @Test void rejectsInvalidProductsQuantitiesAndCoupon() throws Exception {
        for (String items : new String[]{"[]", "null", "{}", "[null]", "[{\"id\":999,\"quantity\":1}]", "[{\"id\":1,\"quantity\":0}]", "[{\"id\":1,\"quantity\":-1}]", "[{\"id\":1,\"quantity\":1.5}]", "[{\"id\":1,\"quantity\":\"1\"}]", "[{\"id\":1,\"quantity\":100}]", "[{\"id\":1,\"quantity\":99},{\"id\":1,\"quantity\":1}]"}) {
            var parsed = json.readTree(items);
            assertThatThrownBy(() -> service.price(parsed, "")).isInstanceOf(ApiException.class);
        }
        var valid = json.readTree("[{\"id\":1,\"quantity\":1}]");
        assertThatThrownBy(() -> service.price(valid, "HACK")).isInstanceOf(ApiException.class);
    }
    @Test void validatesAndNormalizesDelivery() throws Exception {
        var delivery = service.delivery(json.readTree("{\"name\":\" Shopper \",\"address\":\"123 Sample Street\",\"city\":\" Hyderabad \",\"phone\":\"+91 (99999) 99999\"}"));
        assertThat(delivery.path("name").asText()).isEqualTo("Shopper");
        assertThat(delivery.path("phone").asText()).isEqualTo("+919999999999");
        assertThatThrownBy(() -> service.delivery(null)).isInstanceOf(ApiException.class);
    }
}
