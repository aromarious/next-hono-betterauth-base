export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0, "never"],
    "subject-full-stop": [0, "never"],
  },
}
