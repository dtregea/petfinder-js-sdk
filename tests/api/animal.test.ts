/* eslint-disable @typescript-eslint/camelcase */
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import { Animal } from "../../src/api/animal";
import { Client } from "../../src/main";


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

it("Creates animal client", () => {
    const client = new Client({apiKey: "foo", secret: "bar"});
    const animal = new Animal(client);

    expect(animal).toBeInstanceOf(Animal);
    expect(client.animal).toBeInstanceOf(Animal);
});

it("Can search animals", async () => {
    const client = new Animal(new Client({apiKey: "foo", secret: "bar", token: "test"}));

    mock.onGet("/animals").reply(200, {
        success: true,
    });

    const response = await client.search();
    expect(response.data.success).toEqual(true);
});

it("Can search animals with parameters", async () => {
    const client = new Animal(new Client({apiKey: "foo", secret: "bar", token: "test"}));

    mock.onGet("/animals", { params: { type: "Dog" } }).reply(200, {
        success: true,
    });

    const response = await client.search({type: "Dog"});
    expect(response.data.success).toEqual(true);
});

it("Can show animal", async () => {
    const client = new Animal(new Client({apiKey: "foo", secret: "bar", token: "test"}));

    mock.onGet("/animals/12345").reply(200, {
        success: true,
    });

    const response = await client.show(12345);
    expect(response.data.success).toEqual(true);
});
