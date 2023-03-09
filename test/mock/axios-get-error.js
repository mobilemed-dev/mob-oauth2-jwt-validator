import axios from "axios";
import {jest} from "@jest/globals";

axios.get = jest.fn();
axios.get.mockRejectedValueOnce(new Error('OAuth2 Issuer is not responding'));

export default axios.get;