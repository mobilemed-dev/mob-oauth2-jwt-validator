import axios from "axios"
import jwt from "jsonwebtoken"
import jwkToPem from 'jwk-to-pem'
import BadFieldError from './errors/BadFieldError.js'
import OAuthNotRespondingError from "./errors/OAuthNotRespondingError.js"
import JWTKeysIsNotSetOrInvalidError from "./errors/JWTKeysIsNotSetOrInvalidError.js";
import ConfigurationNotLoadedError from "./errors/ConfigurationNotLoadedError.js";
import InvalidTokenError from "./errors/InvalidTokenTypeError.js";

const {verify} = jwt

export class TokenValidator {
    static jwks = {}
    static poolsConfiguration = {}
    static oAuth2IssuerBaseUrl = ""

    static getJwks = async function (oAuth2IssuerBaseUrl, poolConfiguration) {
        if (TokenValidator.jwks[poolConfiguration.poolId]) {
            return TokenValidator.jwks[poolConfiguration.poolId]
        }

        const issuer = `${oAuth2IssuerBaseUrl}/${poolConfiguration.poolId}/${poolConfiguration.tenant}`
        const url = `${issuer}/.well-known/jwks.json`
        let response = {}

        try {
            response = await axios.get(url)
        } catch (error) {
            throw new OAuthNotRespondingError()
        }

        if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
            TokenValidator.jwks[poolConfiguration.poolId] = jwkToPem(response.data.keys[response.data.keys.length - 1])
            return TokenValidator.jwks[poolConfiguration.poolId]
        }

        throw new JWTKeysIsNotSetOrInvalidError()
    }

    static loadConfiguration = async function ({ oAuth2IssuerBaseUrl, poolsConfiguration }) {
        if (!oAuth2IssuerBaseUrl || typeof oAuth2IssuerBaseUrl !== 'string') {
            throw new BadFieldError("OAuth2 Issuer was not sent or is invalid. oAuth2IssuerBaseUrl must be a valid string URI.")
        }

        if (!poolsConfiguration || !Array.isArray(poolsConfiguration) || poolsConfiguration.length === 0) {
            throw new BadFieldError("poolsConfiguration was not sent or is invalid. poolsConfiguration must be a valid array.")
        }

        const isInvalid = poolsConfiguration.some((poolConfiguration) => { TokenValidator.validatePoolsConfiguration(poolConfiguration) })

        if (isInvalid) {
            throw new BadFieldError("poolsConfiguration was not sent or is invalid. poolsConfiguration must be a valid array.")
        }

        poolsConfiguration.forEach((poolConfiguration) => {
            TokenValidator.poolsConfiguration[poolConfiguration.poolId] = poolConfiguration
        })

        TokenValidator.oAuth2IssuerBaseUrl = oAuth2IssuerBaseUrl
    }

    static validatePoolsConfiguration(poolsConfiguration) {
        if (!poolsConfiguration.poolId) return false
        if (!poolsConfiguration.tenant) return false
        if (poolsConfiguration.clientId !== undefined && !Array.isArray(poolsConfiguration.clientId) && typeof poolsConfiguration.clientId !== 'string') return false;

        return true
    }

    static mapToken(token) {
        const info = token.split('.')[1]
        const base64 = info.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = Buffer.from(base64, 'base64').toString('binary')
        const json = JSON.parse(decoded)
        json.poolId = json.iss.split('/')[3]

        return json
    }

    static validate = async function (token) {
        if (!token || typeof token !== 'string') {
            throw new InvalidTokenError()
        }
        // get information from token using base64
        const tokenDecoded = TokenValidator.mapToken(token)

        //get user pool from iss
        if (!tokenDecoded.poolId) {
            throw new InvalidTokenError()
        }

        
        const tokenConfiguration = TokenValidator.poolsConfiguration[tokenDecoded.poolId]
        
        if (!tokenConfiguration) {
            throw new ConfigurationNotLoadedError()
        }

        if(tokenConfiguration.clientId && !tokenConfiguration.clientId.includes(tokenDecoded.client_id)){
            return false
        }

        const jwks = await TokenValidator.getJwks(TokenValidator.oAuth2IssuerBaseUrl, tokenConfiguration)

        if (!jwks) {
            throw new JWTKeysIsNotSetOrInvalidError()
        }

        try {
            const decoded = verify(token, jwks)

            return !!decoded
        } catch (error) {
            return false
        }
    }

    static dispose = function () {
        TokenValidator.jwks = {}
        TokenValidator.poolsConfiguration = {}
        TokenValidator.oAuth2IssuerBaseUrl = ""
    }
}

export default TokenValidator