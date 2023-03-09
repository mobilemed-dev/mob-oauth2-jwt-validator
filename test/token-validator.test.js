import TokenValidator from "../src/index.js"
import BadFieldError from "../src/errors/BadFieldError"
import OAuthNotRespondingError from "../src/errors/OAuthNotRespondingError.js"
import {default as axiosGetError} from "./mock/axios-get-error.js"
import {default as axiosGetJwtKeys} from "./mock/axios-get-jwt-keys.js"
import {rsaPrivateKey} from './mock/rsa-key.js'

import {describe, test, expect, jest, it, beforeAll, afterAll} from "@jest/globals"
import axios from "axios"
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

jest.mock('axios')

describe('Load configuration', () => {
    test('Expect throw error that OAuth2 Issuer was not sent or is invalid.', async () => {
        await expect(TokenValidator.loadConfiguration({})).rejects.toThrow(BadFieldError)
    })

    test('Expect throw error that OAuth2 Issuer is not responding', async () => {
        axios.get = axiosGetError

        await expect(TokenValidator.loadConfiguration({oAuth2Issuer: 'https://auth.example.com'})).rejects.toThrow(OAuthNotRespondingError)
    })

    test('Expect load the configuration correctly', async () => {
        axios.get = axiosGetJwtKeys

        await expect(TokenValidator.loadConfiguration({oAuth2Issuer: 'https://auth.example.com'})).resolves.not.toThrow()
    })
})

describe('Validate Token', () => {
    beforeAll(async () => {
        axios.get = axiosGetJwtKeys

        await TokenValidator.loadConfiguration({oAuth2Issuer: 'https://example.com'})
    })

    afterAll(() => {
        TokenValidator.dispose()
    })

    it('should return true for a valid JWT token', () => {
        const privateKey = jwkToPem(rsaPrivateKey, {private: true})
        const tokenPayload = {sub: '12345', name: 'John Doe', iat: Math.floor(Date.now() / 1000)}
        const token = jwt.sign(tokenPayload, privateKey, {algorithm: 'RS256', expiresIn: '1h'})


        const result = TokenValidator.validate(token)
        expect(result).toBe(true)
    })

    it('should return false for an invalid JWT token', () => {
        const token = 'invalid.token'
        const result = TokenValidator.validate(token)
        expect(result).toBe(false)
    })
})