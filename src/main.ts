import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import { Animal } from "./api/animal";
import { AnimalData } from "./api/animalData";
import { Organization } from "./api/organization";
import { ProblemDetailsError } from "./error";

interface ClientConfig {
    apiKey: string;
    secret: string;
    token?: string;
    baseUrl?: string;
}

export class Client {
    public http: AxiosInstance;
    private config: ClientConfig;

    constructor(config: ClientConfig) {
        this.config = config;
        this.http = axios.create({
            baseURL: config.baseUrl || "https://api.petfinder.com/v2",
            headers: {"x-api-sdk": "petfinder-js-sdk/v1.0 (https://github.com/petfinder-com/petfinder-js-sdk)"},
        });

        this.http.interceptors.response.use((response: AxiosResponse) => {
            return response;
        },  async (error: AxiosError) => {
            if (error.response && this.isProblemDetailsResponse(error.response)) {
                if (error.response.status === 401) {
                    const authResponse = await this.authenticate();
                    error.config.headers.Authorization = `Bearer ${authResponse.data.access_token}`;
                    return axios.request(error.config);
                } else {
                    return Promise.reject(new ProblemDetailsError(error.request, error.response));
                }
            }

            return Promise.reject(error);
        });
    }

    get animalData(): AnimalData {
        return new AnimalData(this);
    }

    get animal(): Animal {
        return new Animal(this);
    }

    get organization(): Organization {
        return new Organization(this);
    }

    public async authenticate(): Promise<AxiosResponse> {
        const response = await this.http.post("/oauth2/token", {
            // eslint-disable-next-line @typescript-eslint/camelcase
            client_id: this.config.apiKey,
            // eslint-disable-next-line @typescript-eslint/camelcase
            client_secret: this.config.secret,
            // eslint-disable-next-line @typescript-eslint/camelcase
            grant_type: "client_credentials",
        });
        const accessToken = response.data.access_token;
        this.config.token = accessToken;
        this.http.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        return response;
    }

    private isProblemDetailsResponse(response: AxiosResponse): boolean {
        const headers = response.headers || {};
        const contentType = headers["content-type"] || "";
        return contentType.includes("application/problem+json");
    }
}
