import axios from "axios";
import {jest} from "@jest/globals";
import {rsaPublicKey} from "./rsa-key.js";

const mockedData = {
    data: {
        keys: [
            rsaPublicKey
        ]
    }
}

axios.get = jest.fn();
axios.get.mockResolvedValue(mockedData)

export default axios.get;