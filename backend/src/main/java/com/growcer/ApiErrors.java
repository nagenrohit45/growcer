package com.growcer;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiErrors {
    private static final Logger log = LoggerFactory.getLogger(ApiErrors.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException error) { return error(error.status(), error.getMessage()); }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> invalidJson(Exception ignored) { return error(400, "Invalid JSON."); }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<?> contentType(Exception ignored) { return error(415, "Send a JSON request."); }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<?> method(Exception ignored) { return error(405, "Method not allowed."); }
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> missing(Exception ignored) { return error(404, "API route not found."); }
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database(Exception ignored) { return error(503, "The store database is unavailable. Please try again shortly."); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception exception) {
        log.error("Growcer request failed: {}", exception.getClass().getSimpleName());
        return error(500, "Something went wrong. Please try again.");
    }
    private ResponseEntity<?> error(int status, String message) { return ResponseEntity.status(status).body(Map.of("error", message)); }
}
