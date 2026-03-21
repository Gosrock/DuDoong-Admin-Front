package band.gosrock.api.auth.service.helper

import band.gosrock.api.auth.model.dto.response.TokenAndUserResponse
import band.gosrock.common.helper.SpringEnvironmentHelper
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class CookieHelperTest {

    private val springEnvironmentHelper: SpringEnvironmentHelper = mock()
    private lateinit var cookieHelper: CookieHelper

    @BeforeEach
    fun setUp() {
        cookieHelper = CookieHelper(springEnvironmentHelper)
    }

    private fun mockTokenResponse(): TokenAndUserResponse = TokenAndUserResponse(
        accessToken = "test-access-token",
        refreshToken = "test-refresh-token",
        accessTokenAge = 3600L,
        refreshTokenAge = 7200L,
        userProfile = null,
    )

    private fun mockRequest(vararg cookies: Cookie): HttpServletRequest {
        val request: HttpServletRequest = mock()
        whenever(request.cookies).thenReturn(if (cookies.isEmpty()) null else cookies.toList().toTypedArray())
        return request
    }

    @Nested
    @DisplayName("프로덕션 프로필")
    inner class ProdProfile {

        @BeforeEach
        fun setUp() {
            whenever(springEnvironmentHelper.isProdProfile()).thenReturn(true)
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isProdAndStagingProfile()).thenReturn(true)
        }

        @Test
        @DisplayName("쿠키 이름에 prefix가 없다")
        fun cookieNamesWithoutPrefix() {
            assertEquals("accessToken", cookieHelper.getAccessTokenName())
            assertEquals("refreshToken", cookieHelper.getRefreshTokenName())
        }

        @Test
        @DisplayName("domain=.dudoong.com이 설정된다")
        fun domainIsSet() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("Domain=.dudoong.com"), "domain 미설정: $cookie")
            }
        }

        @Test
        @DisplayName("SameSite=Strict로 설정된다")
        fun sameSiteStrict() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("SameSite=Strict"), "SameSite 미설정: $cookie")
            }
        }

        @Test
        @DisplayName("refreshToken 쿠키에서 값을 읽는다")
        fun readRefreshToken() {
            val request = mockRequest(Cookie("refreshToken", "my-refresh-token"))
            assertEquals("my-refresh-token", cookieHelper.getRefreshTokenFromRequest(request))
        }

        @Test
        @DisplayName("stg_ prefix 쿠키는 읽지 않는다")
        fun doesNotReadStagingCookie() {
            val request = mockRequest(Cookie("stg_refreshToken", "staging-token"))
            assertNull(cookieHelper.getRefreshTokenFromRequest(request))
        }
    }

    @Nested
    @DisplayName("스테이징 프로필")
    inner class StagingProfile {

        @BeforeEach
        fun setUp() {
            whenever(springEnvironmentHelper.isProdProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(true)
            whenever(springEnvironmentHelper.isProdAndStagingProfile()).thenReturn(true)
        }

        @Test
        @DisplayName("쿠키 이름에 stg_ prefix가 붙는다")
        fun cookieNamesWithPrefix() {
            assertEquals("stg_accessToken", cookieHelper.getAccessTokenName())
            assertEquals("stg_refreshToken", cookieHelper.getRefreshTokenName())
        }

        @Test
        @DisplayName("domain=.dudoong.com이 설정된다")
        fun domainIsSet() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("Domain=.dudoong.com"), "domain 미설정: $cookie")
            }
        }

        @Test
        @DisplayName("SameSite=None으로 설정된다")
        fun sameSiteNone() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("SameSite=None"), "SameSite 미설정: $cookie")
            }
        }

        @Test
        @DisplayName("stg_refreshToken 쿠키에서 값을 읽는다")
        fun readStagingRefreshToken() {
            val request = mockRequest(Cookie("stg_refreshToken", "staging-refresh"))
            assertEquals("staging-refresh", cookieHelper.getRefreshTokenFromRequest(request))
        }

        @Test
        @DisplayName("prefix 없는 refreshToken 쿠키는 읽지 않는다")
        fun doesNotReadProdCookie() {
            val request = mockRequest(Cookie("refreshToken", "prod-token"))
            assertNull(cookieHelper.getRefreshTokenFromRequest(request))
        }

        @Test
        @DisplayName("프로덕션 쿠키와 스테이징 쿠키가 섞이지 않는다")
        fun noCrossContamination() {
            val request = mockRequest(
                Cookie("refreshToken", "prod-token"),
                Cookie("stg_refreshToken", "staging-token"),
            )
            assertEquals("staging-token", cookieHelper.getRefreshTokenFromRequest(request))
        }
    }

    @Nested
    @DisplayName("로컬 프로필")
    inner class LocalProfile {

        @BeforeEach
        fun setUp() {
            whenever(springEnvironmentHelper.isProdProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isProdAndStagingProfile()).thenReturn(false)
        }

        @Test
        @DisplayName("쿠키 이름에 prefix가 없다")
        fun cookieNamesWithoutPrefix() {
            assertEquals("accessToken", cookieHelper.getAccessTokenName())
            assertEquals("refreshToken", cookieHelper.getRefreshTokenName())
        }

        @Test
        @DisplayName("domain이 설정되지 않는다")
        fun domainNotSet() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertFalse(cookie.contains("Domain"), "로컬에서 domain이 설정됨: $cookie")
            }
        }

        @Test
        @DisplayName("SameSite=None으로 설정된다")
        fun sameSiteNone() {
            val headers = cookieHelper.getTokenCookies(mockTokenResponse())
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("SameSite=None"), "SameSite 미설정: $cookie")
            }
        }
    }

    @Nested
    @DisplayName("쿠키 삭제")
    inner class DeleteCookies {

        @Test
        @DisplayName("프로덕션에서 삭제 쿠키에 domain이 포함된다")
        fun deleteCookiesWithDomain() {
            whenever(springEnvironmentHelper.isProdProfile()).thenReturn(true)
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isProdAndStagingProfile()).thenReturn(true)

            val headers = cookieHelper.deleteCookies()
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            assertEquals(2, setCookies.size)
            setCookies.forEach { cookie ->
                assertTrue(cookie.contains("Max-Age=0"), "Max-Age 미설정: $cookie")
                assertTrue(cookie.contains("Domain=.dudoong.com"), "domain 미설정: $cookie")
            }
        }

        @Test
        @DisplayName("스테이징에서 삭제 쿠키 이름에 stg_ prefix가 붙는다")
        fun deleteStagingCookies() {
            whenever(springEnvironmentHelper.isProdProfile()).thenReturn(false)
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(true)
            whenever(springEnvironmentHelper.isProdAndStagingProfile()).thenReturn(true)

            val headers = cookieHelper.deleteCookies()
            val setCookies = headers[org.springframework.http.HttpHeaders.SET_COOKIE]!!
            val cookieString = setCookies.joinToString("; ")
            assertTrue(cookieString.contains("stg_accessToken"), "stg_ prefix 미사용: $cookieString")
            assertTrue(cookieString.contains("stg_refreshToken"), "stg_ prefix 미사용: $cookieString")
        }
    }

    @Nested
    @DisplayName("요청에서 쿠키 읽기")
    inner class ReadFromRequest {

        @Test
        @DisplayName("쿠키가 없으면 null을 반환한다")
        fun noCookiesReturnsNull() {
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(false)
            val request = mockRequest()
            assertNull(cookieHelper.getRefreshTokenFromRequest(request))
        }

        @Test
        @DisplayName("빈 쿠키 배열이면 null을 반환한다")
        fun emptyCookiesReturnsNull() {
            whenever(springEnvironmentHelper.isStagingProfile()).thenReturn(false)
            val request: HttpServletRequest = mock()
            whenever(request.cookies).thenReturn(emptyArray())
            assertNull(cookieHelper.getRefreshTokenFromRequest(request))
        }
    }
}
