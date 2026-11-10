package com.growcer;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    private final SecureRandom random = new SecureRandom();

    public String token() { return randomHex(32); }

    public String hash(String password) {
        String salt = randomHex(16);
        return salt + ":" + HexFormat.of().formatHex(derive(password, salt));
    }

    public boolean matches(String password, String stored) {
        // Preserve the Node crypto.scrypt format: UTF-8 hex salt text, N=16384,r=8,p=1,64 bytes.
        String salt = "invalid-user-salt";
        byte[] expected = new byte[64];
        boolean valid = stored != null && stored.matches("[a-f0-9]{32}:[a-f0-9]{128}");
        if (valid) {
            String[] parts = stored.split(":");
            salt = parts[0]; expected = HexFormat.of().parseHex(parts[1]);
        }
        boolean equal = MessageDigest.isEqual(derive(password, salt), expected);
        return valid && equal;
    }

    public static String digest(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception exception) { throw new IllegalStateException(exception); }
    }

    private byte[] derive(String password, String salt) {
        return SCrypt.generate(password.getBytes(StandardCharsets.UTF_8), salt.getBytes(StandardCharsets.UTF_8), 16384, 8, 1, 64);
    }

    private String randomHex(int size) {
        byte[] bytes = new byte[size]; random.nextBytes(bytes); return HexFormat.of().formatHex(bytes);
    }
}
