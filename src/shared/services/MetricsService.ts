/**
 * MetricsService - Application Metrics Collection
 *
 * Collects and exposes metrics for monitoring:
 * - Authentication metrics (login attempts, failures, successes)
 * - MFA metrics (setup, verification, failures)
 * - OAuth metrics (provider usage, failures)
 * - API key metrics (creation, usage, revocations)
 * - Performance metrics (response times, throughput)
 *
 * Metrics are exposed in Prometheus format for monitoring systems.
 *
 * @class MetricsService
 */

import {cacheService} from "./CacheService";
import logger from "../infrastructure/logging";

export interface IMetric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface IMetricsSummary {
  authentication: {
    loginAttempts: number;
    loginSuccesses: number;
    loginFailures: number;
    registrations: number;
  };
  mfa: {
    setupAttempts: number;
    enableSuccesses: number;
    verifications: number;
    verificationFailures: number;
  };
  oauth: {
    googleLogins: number;
    facebookLogins: number;
    githubLogins: number;
    accountLinkings: number;
  };
  apiKeys: {
    created: number;
    revoked: number;
    usages: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
  };
}

export class MetricsService {
  private static instance: MetricsService;
  private readonly METRICS_PREFIX = "metrics:";
  private readonly TTL = 86400; // 24 hours

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Increment a counter metric
   *
   * @param metric - Metric name
   * @param labels - Optional labels
   */
  async incrementCounter(metric: string, labels?: Record<string, string>): Promise<void> {
    try {
      const key = this.buildMetricKey(metric, labels);
      await cacheService.incr(key, this.TTL);
      logger.debug("Metric incremented", {metric, labels});
    } catch (error) {
      logger.error("Failed to increment metric", {metric, error});
    }
  }

  /**
   * Record a gauge metric
   *
   * @param metric - Metric name
   * @param value - Metric value
   * @param labels - Optional labels
   */
  async recordGauge(
    metric: string,
    value: number,
    labels?: Record<string, string>
  ): Promise<void> {
    try {
      const key = this.buildMetricKey(metric, labels);
      await cacheService.set(key, value, this.TTL);
      logger.debug("Gauge recorded", {metric, value, labels});
    } catch (error) {
      logger.error("Failed to record gauge", {metric, error});
    }
  }

  /**
   * Get metric value
   *
   * @param metric - Metric name
   * @param labels - Optional labels
   * @returns Metric value
   */
  async getMetric(metric: string, labels?: Record<string, string>): Promise<number> {
    try {
      const key = this.buildMetricKey(metric, labels);
      const value = await cacheService.get<number>(key);
      return value || 0;
    } catch (error) {
      logger.error("Failed to get metric", {metric, error});
      return 0;
    }
  }

  /**
   * Build metric key with labels
   *
   * @private
   */
  private buildMetricKey(metric: string, labels?: Record<string, string>): string {
    let key = `${this.METRICS_PREFIX}${metric}`;
    if (labels) {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}:${v}`)
        .join(",");
      key += `{${labelStr}}`;
    }
    return key;
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(success: boolean, method: "password" | "mfa" | "oauth"): Promise<void> {
    await this.incrementCounter("auth.login.attempts", {method});
    if (success) {
      await this.incrementCounter("auth.login.successes", {method});
    } else {
      await this.incrementCounter("auth.login.failures", {method});
    }
  }

  /**
   * Record registration
   */
  async recordRegistration(method: "email" | "oauth"): Promise<void> {
    await this.incrementCounter("auth.registrations", {method});
  }

  /**
   * Record MFA setup
   */
  async recordMfaSetup(): Promise<void> {
    await this.incrementCounter("mfa.setup.attempts");
  }

  /**
   * Record MFA enable
   */
  async recordMfaEnable(success: boolean): Promise<void> {
    if (success) {
      await this.incrementCounter("mfa.enable.successes");
    } else {
      await this.incrementCounter("mfa.enable.failures");
    }
  }

  /**
   * Record MFA verification
   */
  async recordMfaVerification(success: boolean, usedBackupCode: boolean): Promise<void> {
    await this.incrementCounter("mfa.verifications");
    if (success) {
      if (usedBackupCode) {
        await this.incrementCounter("mfa.backup_code.used");
      } else {
        await this.incrementCounter("mfa.totp.verified");
      }
    } else {
      await this.incrementCounter("mfa.verification.failures");
    }
  }

  /**
   * Record OAuth login
   */
  async recordOAuthLogin(provider: string, isNewUser: boolean): Promise<void> {
    await this.incrementCounter(`oauth.${provider}.logins`);
    if (isNewUser) {
      await this.incrementCounter(`oauth.${provider}.new_users`);
    }
  }

  /**
   * Record OAuth account linking
   */
  async recordOAuthLinking(provider: string, action: "link" | "unlink"): Promise<void> {
    await this.incrementCounter(`oauth.${provider}.${action}`);
  }

  /**
   * Record API key operation
   */
  async recordApiKeyOperation(operation: "created" | "revoked" | "regenerated" | "used"): Promise<void> {
    await this.incrementCounter(`apikey.${operation}`);
  }

  /**
   * Record request metrics
   */
  async recordRequest(path: string, method: string, duration: number, statusCode: number): Promise<void> {
    await this.incrementCounter("http.requests", {method, path, status: statusCode.toString()});
    await this.recordGauge("http.response_time", duration, {method, path});
  }

  /**
   * Get comprehensive metrics summary
   */
  async getMetricsSummary(): Promise<IMetricsSummary> {
    const [
      loginAttempts,
      loginSuccesses,
      loginFailures,
      registrations,
      mfaSetupAttempts,
      mfaEnableSuccesses,
      mfaVerifications,
      mfaVerificationFailures,
      googleLogins,
      facebookLogins,
      githubLogins,
      accountLinkings,
      apiKeysCreated,
      apiKeysRevoked,
      apiKeysUsages,
    ] = await Promise.all([
      this.getMetric("auth.login.attempts", {method: "password"}),
      this.getMetric("auth.login.successes", {method: "password"}),
      this.getMetric("auth.login.failures", {method: "password"}),
      this.getMetric("auth.registrations", {method: "email"}),
      this.getMetric("mfa.setup.attempts"),
      this.getMetric("mfa.enable.successes"),
      this.getMetric("mfa.verifications"),
      this.getMetric("mfa.verification.failures"),
      this.getMetric("oauth.google.logins"),
      this.getMetric("oauth.facebook.logins"),
      this.getMetric("oauth.github.logins"),
      this.getMetric("oauth.google.link"),
      this.getMetric("apikey.created"),
      this.getMetric("apikey.revoked"),
      this.getMetric("apikey.used"),
    ]);

    return {
      authentication: {
        loginAttempts,
        loginSuccesses,
        loginFailures,
        registrations,
      },
      mfa: {
        setupAttempts: mfaSetupAttempts,
        enableSuccesses: mfaEnableSuccesses,
        verifications: mfaVerifications,
        verificationFailures: mfaVerificationFailures,
      },
      oauth: {
        googleLogins,
        facebookLogins,
        githubLogins,
        accountLinkings,
      },
      apiKeys: {
        created: apiKeysCreated,
        revoked: apiKeysRevoked,
        usages: apiKeysUsages,
      },
      performance: {
        avgResponseTime: 0, // Calculate from gauges
        requestsPerMinute: 0, // Calculate from counters
      },
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  async exportPrometheusMetrics(): Promise<string> {
    const summary = await this.getMetricsSummary();
    const lines: string[] = [];

    // Authentication metrics
    lines.push('# HELP auth_login_attempts_total Total login attempts');
    lines.push('# TYPE auth_login_attempts_total counter');
    lines.push(`auth_login_attempts_total{method="password"} ${summary.authentication.loginAttempts}`);

    lines.push('# HELP auth_login_successes_total Total successful logins');
    lines.push('# TYPE auth_login_successes_total counter');
    lines.push(`auth_login_successes_total{method="password"} ${summary.authentication.loginSuccesses}`);

    lines.push('# HELP auth_login_failures_total Total failed logins');
    lines.push('# TYPE auth_login_failures_total counter');
    lines.push(`auth_login_failures_total{method="password"} ${summary.authentication.loginFailures}`);

    lines.push('# HELP auth_registrations_total Total registrations');
    lines.push('# TYPE auth_registrations_total counter');
    lines.push(`auth_registrations_total{method="email"} ${summary.authentication.registrations}`);

    // MFA metrics
    lines.push('# HELP mfa_setup_attempts_total Total MFA setup attempts');
    lines.push('# TYPE mfa_setup_attempts_total counter');
    lines.push(`mfa_setup_attempts_total ${summary.mfa.setupAttempts}`);

    lines.push('# HELP mfa_enable_successes_total Total MFA enablements');
    lines.push('# TYPE mfa_enable_successes_total counter');
    lines.push(`mfa_enable_successes_total ${summary.mfa.enableSuccesses}`);

    lines.push('# HELP mfa_verifications_total Total MFA verifications');
    lines.push('# TYPE mfa_verifications_total counter');
    lines.push(`mfa_verifications_total ${summary.mfa.verifications}`);

    // OAuth metrics
    lines.push('# HELP oauth_logins_total Total OAuth logins by provider');
    lines.push('# TYPE oauth_logins_total counter');
    lines.push(`oauth_logins_total{provider="google"} ${summary.oauth.googleLogins}`);
    lines.push(`oauth_logins_total{provider="facebook"} ${summary.oauth.facebookLogins}`);
    lines.push(`oauth_logins_total{provider="github"} ${summary.oauth.githubLogins}`);

    // API Key metrics
    lines.push('# HELP apikey_created_total Total API keys created');
    lines.push('# TYPE apikey_created_total counter');
    lines.push(`apikey_created_total ${summary.apiKeys.created}`);

    lines.push('# HELP apikey_revoked_total Total API keys revoked');
    lines.push('# TYPE apikey_revoked_total counter');
    lines.push(`apikey_revoked_total ${summary.apiKeys.revoked}`);

    return lines.join('\n');
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
