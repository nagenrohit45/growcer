package com.growcer;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

final class BoundedJsonRequest extends HttpServletRequestWrapper {
    private final byte[] body;
    BoundedJsonRequest(HttpServletRequest request, byte[] body) { super(request); this.body = body; }
    @Override public ServletInputStream getInputStream() {
        var stream = new ByteArrayInputStream(body);
        return new ServletInputStream() {
            @Override public boolean isFinished() { return stream.available() == 0; }
            @Override public boolean isReady() { return true; }
            @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException("Synchronous JSON requests only."); }
            @Override public int read() { return stream.read(); }
        };
    }
    @Override public BufferedReader getReader() { return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8)); }
}
