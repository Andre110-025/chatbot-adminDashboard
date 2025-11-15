export function useHelpers() {
  const containsUppercase = (value) => /[A-Z]/.test(value)
  const containsLowercase = (value) => /[a-z]/.test(value)
  const containsNumber = (value) => /[0-9]/.test(value)
  const containsSpecial = (value) => /[#?!@$()`~%^&*-+=]/.test(value)

  return {
    containsUppercase,
    containsLowercase,
    containsNumber,
    containsSpecial,
  }
}
