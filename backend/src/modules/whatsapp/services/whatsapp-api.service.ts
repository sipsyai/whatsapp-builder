import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { WhatsAppApiException } from '../exceptions/whatsapp-api.exception';
import { ApiErrorMapper } from '../utils/api-error-mapper.util';

@Injectable()
export class WhatsAppApiService {
  private readonly logger = new Logger(WhatsAppApiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('whatsapp.apiVersion') || 'v18.0';
    this.baseUrl = this.configService.get<string>('whatsapp.baseUrl') || 'https://graph.facebook.com';
    this.accessToken = this.configService.get<string>('whatsapp.accessToken') || '';
    this.phoneNumberId = this.configService.get<string>(
      'whatsapp.phoneNumberId',
    ) || '';

    // Validate required configuration
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error(
        'WhatsApp configuration is missing. Please check WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID',
      );
    }

    // Create axios instance with defaults
    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleApiError(error),
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * Send message (base method)
   */
  async sendMessage(payload: any): Promise<any> {
    this.logger.log(`Sending message to ${payload.to}`);
    return this.post(`/${this.phoneNumberId}/messages`, payload);
  }

  /**
   * Get phone number ID
   */
  getPhoneNumberId(): string {
    return this.phoneNumberId;
  }

  /**
   * Get WABA ID
   */
  getWabaId(): string {
    return this.configService.get<string>('whatsapp.wabaId') || '';
  }

  /**
   * Get API version
   */
  getApiVersion(): string {
    return this.apiVersion;
  }

  /**
   * Handle API errors with proper mapping
   */
  private handleApiError(error: AxiosError): never {
    this.logger.error('WhatsApp API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    const mappedError = ApiErrorMapper.mapError(error);
    throw new WhatsAppApiException(
      mappedError.message,
      mappedError.code,
      mappedError.statusCode,
      mappedError.details,
    );
  }
}
