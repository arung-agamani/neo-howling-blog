import {
    LoginParams,
    SignupRequestBody,
    TUpdateUserPayload,
    TUpdateUserResponse,
    TUserRoles,
    TUserSchema,
    UpdateUserPayload,
    UpdateUserResponse,
    UserSchema,
} from "./types";

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

describe("UserSchema Validation", () => {
    it("Passes validation on valid input", () => {
        const payload: TUserSchema = {
            username: "awooawoo",
            email: "awoo@howlingmoon.dev",
            role: "guest",
            dateCreated: new Date(),
            lastAccess: new Date(),
        };
        const validate = UserSchema.safeParse(payload);
        expect(validate.success).toEqual(true);
    });

    it("Failed on invalid input", () => {
        const payload: TUserSchema = {
            username: "awo12", // username shouldn't has numbers | length smaller than 6
            email: "haha", // not an email
            role: "anjay" as unknown as TUserRoles, // not a member of valid roles
            dateCreated: "this date" as unknown as Date, // not a valid date object
            lastAccess: "that date" as unknown as Date, // not a valid date object
        };
        const validate = UserSchema.safeParse(payload);
        expect(validate.success).toEqual(false);
        if (!validate.success) {
            expect(validate.error.issues.length).toEqual(6);
        }
    });
});

describe("UpdateUserPayload Validation", () => {
    it("Passes validation on valid payload", () => {
        const payload: TUpdateUserPayload = {
            username: "aweooaweo",
            role: "user",
        };
        const validate = UpdateUserPayload.safeParse(payload);
        expect(validate.success).toEqual(true);
    });

    it("Failed on invalid payload", () => {
        const payload: TUpdateUserPayload = {
            username: "aweo1", // no numbers | min 6 (has 5)
            role: "haha" as never, // invalid member
        };
        const validate = UpdateUserPayload.safeParse(payload);
        expect(validate.success).toEqual(false);
        if (!validate.success) {
            expect(validate.error.issues.length).toEqual(3);
        }
    });
});

describe("UpdateUserResponse Validation", () => {
    it("Passes validation on valid payload on both scenario", () => {
        const payload1: TUpdateUserResponse = {
            success: true,
            updated: 1,
        };
        let validate = UpdateUserResponse.safeParse(payload1);
        expect(validate.success).toEqual(true);
        const payload2: TUpdateUserResponse = {
            success: false,
            message: "anjay",
        };
        validate = UpdateUserResponse.safeParse(payload2);
        expect(validate.success).toEqual(true);
    });

    it("Failed on malformed shape - Success but no updated field", () => {
        const payload: unknown = {
            success: true,
            message: "Lulus",
        };
        const validate = UpdateUserResponse.safeParse(payload);
        expect(validate.success).toEqual(false);
    });
    it("Failed on malformed shape - Failed but no message field", () => {
        const payload: unknown = {
            success: false,
        };
        const validate = UpdateUserResponse.safeParse(payload);
        expect(validate.success).toEqual(false);
    });
});
