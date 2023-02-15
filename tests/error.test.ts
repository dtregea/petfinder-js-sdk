/* eslint-disable @typescript-eslint/camelcase */

import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import { ProblemDetailsError } from "../src/error";
import { Client } from "../src/main";

let mock: any;
beforeEach(()=>{
    mock = new MockAdapter(axios);
    mock.onPost("/oauth2/token", {
        client_id: "foo",
        client_secret: "bar",
        grant_type: "client_credentials",
    }).reply(200, {
        access_token: "test",
        expires_in: 3600,
    });
});

afterEach(()=> {
    mock.restore();
});

it("Should throw Generic Error on rerequest failure", async () => {
    mock.onGet("/test").reply(401, {
        detail: "Missing Authorization headers",
        status: 401,
        title: "Unauthorized",
        type: "https://httpstatuses.com/401",
    }, {"content-type": "application/problem+json"});

    const client = new Client({apiKey: "foo", secret: "bar"});

    await client.http.get("/test").then(() => {
        fail("Got a success response");
    }).catch((err) => {        
        expect(err.response).not.toBeInstanceOf(ProblemDetailsError);
        expect(err.response.status).toEqual(401);        
    });
});

it("Should throw ProblemDetailsError with invalidParams", async () => {
    mock.onGet("/test").reply(400, {
        "detail": "Your request contains invalid parameters",
        "invalid-params": {foo: "bar"},
        "status": 400,
        "title": "Invalid Parameters",
        "type": "https://httpstatuses.com/400",
    }, {"content-type": "application/problem+json"});

    const client = new Client({apiKey: "foo", secret: "bar"});

    await client.http.get("/test").then(() => {
        fail("Got a success response");
    }).catch((err) => {
        expect(err).toBeInstanceOf(ProblemDetailsError);
        expect(err.invalidParams).toEqual({foo: "bar"});
    });
});

it("Should not throw ProblemDetailsError on other error responses", async () => {
    mock.onGet("/test").reply(500);

    const client = new Client({apiKey: "foo", secret: "bar"});

    await client.http.get("/test").then(() => {
        fail("Got a success response");
    }).catch((err) => {
        expect(err).not.toBeInstanceOf(ProblemDetailsError);
    });
});
