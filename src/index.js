import axios from "axios"
import {verify} from "jsonwebtoken"
import jwkToPem from 'jwk-to-pem'
import BadFieldError from './errors/BadFieldError.js'
import OAuthNotRespondingError from "./errors/OAuthNotRespondingError.js"
import JWTKeysIsNotSetOrInvalidError from "./errors/JWTKeysIsNotSetOrInvalidError.js";
import ConfigurationNotLoadedError from "./errors/ConfigurationNotLoadedError.js";
import InvalidTokenError from "./errors/InvalidTokenTypeError.js";

class TokenValidator {
    static #issuer = null
    static #jwks = null

    static #setOauth(oAuth2Issuer) {
        if (!oAuth2Issuer || typeof oAuth2Issuer !== 'string') {
            throw new BadFieldError("OAuth2 Issuer was not sent or is invalid. oAuth2Issuer must be a valid string URI.")
        }

        oAuth2Issuer = oAuth2Issuer.replace(/\/$/, '')

        TokenValidator.#issuer = oAuth2Issuer
    }

    static async loadConfiguration({oAuth2Issuer}) {
        if (TokenValidator.#jwks) {
            return
        }

        TokenValidator.#setOauth(oAuth2Issuer)
        const url = `${TokenValidator.#issuer}/.well-known/jwks.json`
        let response = {}

        try {
            response = await axios.get(url)
        } catch (error) {
            throw new OAuthNotRespondingError()
        }

        if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
            TokenValidator.#jwks = jwkToPem(response.data.keys[response.data.keys.length - 1])
            return
        }

        throw new JWTKeysIsNotSetOrInvalidError()
    }

    static validate(token) {
        if (!TokenValidator.#jwks) {
            throw new ConfigurationNotLoadedError()
        }

        if (!token || typeof token !== 'string') {
            throw new InvalidTokenError()
        }

        try {
            const decoded = verify(token, TokenValidator.#jwks)

            return !!decoded
        } catch (error) {
            return false
        }
    }

    static dispose() {
        TokenValidator.#issuer = null
        TokenValidator.#jwks = null
    }
}

export default TokenValidator