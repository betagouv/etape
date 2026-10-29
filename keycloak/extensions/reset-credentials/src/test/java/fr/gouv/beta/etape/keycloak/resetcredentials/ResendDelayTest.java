package fr.gouv.beta.etape.keycloak.resetcredentials;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ResendDelayTest {

    private static final long NOW = 1_800_000_000L;

    @Test
    void waitsTheFullDelayRightAfterARequest() {
        assertEquals(120, ResendDelay.remainingSeconds(Long.toString(NOW), NOW));
    }

    @Test
    void countsDownAsTimePasses() {
        assertEquals(75, ResendDelay.remainingSeconds(Long.toString(NOW - 45), NOW));
    }

    @Test
    void allowsAResendOnceTheDelayHasElapsed() {
        assertEquals(0, ResendDelay.remainingSeconds(Long.toString(NOW - 120), NOW));
        assertEquals(0, ResendDelay.remainingSeconds(Long.toString(NOW - 3600), NOW));
    }

    @Test
    void neverExceedsTheDelayWhenTheClockGoesBack() {
        assertEquals(120, ResendDelay.remainingSeconds(Long.toString(NOW + 30), NOW));
    }

    @Test
    void allowsAResendWithoutAPreviousRequest() {
        assertEquals(0, ResendDelay.remainingSeconds(null, NOW));
        assertEquals(0, ResendDelay.remainingSeconds("pas un nombre", NOW));
    }
}
