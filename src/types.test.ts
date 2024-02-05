import { LoginParams, SignupRequestBody } from "./types";

describe("LoginParams Validation Test", () => {
    it("Passes Validation on Valid Payload", () => {
        const payload = {
            username: "ABCDabcd",
            password: "ABCD0123@",
        };
        const validate = LoginParams.safeParse(payload);
        expect(validate.success).toBe(true);
    });

    it("Failed on Numbers in Username", () => {
        const payload = {
            username: "ABCDabcd1",
            password: "ABCD0123@",
        };
        const validate = LoginParams.safeParse(payload);
        expect(validate.success).toEqual(false);
    });

    it("Failed on Illegal Symbols in Password", () => {
        const payload = {
            username: "ABCDabcd1",
            password: "ABCD0123@##$$",
        };
        const validate = LoginParams.safeParse(payload);
        expect(validate.success).toEqual(false);
    });

    it("Failed on Incorrect Length", () => {
        const payload = {
            username: "ABC",
            password:
                "ABCD0123@##$$^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
        };
        const validate = LoginParams.safeParse(payload);
        expect(validate.success).toEqual(false);
        if (validate.success === false) {
            expect(validate.error.issues.length).toEqual(2);
        }
    });
});

describe("SignupRequestBody Validation Test", () => {
    it("Passes Validation on Valid Payload", () => {
        const payload = {
            username: "ABCDabcd",
            password: "ABCD0123@",
            confirmPassword: "ABCD0123@",
        };
        const validate = SignupRequestBody.safeParse(payload);
        expect(validate.success).toEqual(true);
    });

    it("Failed on Password and Confirm Password Mismatch", () => {
        const payload = {
            username: "ABCDabcd1",
            password: "ABCD0123@",
            confirmPassword: "ABCD0123&",
        };
        const validate = SignupRequestBody.safeParse(payload);
        expect(validate.success).toEqual(false);
    });

    it("Failed on Numbers in Username", () => {
        const payload = {
            username: "ABCDabcd1",
            password: "ABCD0123@",
            confirmPassword: "ABCD0123@",
        };
        const validate = SignupRequestBody.safeParse(payload);
        expect(validate.success).toEqual(false);
    });

    it("Failed on Illegal Symbols in Password", () => {
        const payload = {
            username: "ABCDabcd1",
            password: "ABCD0123@##$$",
            confirmPassword: "ABCD0123@##$$",
        };
        const validate = SignupRequestBody.safeParse(payload);
        expect(validate.success).toEqual(false);
    });

    it("Failed on Incorrect Length", () => {
        const payload = {
            username: "ABC1",
            password:
                "ABCD0123@##$$^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
            confirmPassword:
                "ABCD0123@##$$^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^z",
        };
        const validate = SignupRequestBody.safeParse(payload);
        expect(validate.success).toEqual(false);
    });
});
