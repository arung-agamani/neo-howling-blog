"use client";

export default function ScrollTop() {
    return (
        <div
            className="floating-button"
            onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 -960 960 960"
                width="24"
            >
                <path
                    fill="white"
                    d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"
                />
            </svg>
        </div>
    );
}
