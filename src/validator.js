const checkSpaces = (str, exact = true) => {
  var len = str.replace(/\s/g, "").length;
  return exact ? len === str.length && len !== 0 : len !== 0;
};

const checklen = (min, max, str, strict = true) => {
  if (!checkSpaces(str, strict)) {
    return false;
  } else {
    if (!(str.length <= max && str.length >= min)) {
      return false;
    } else {
      return true;
    }
  }
};

const regex = {
  lowercase: /.*[a-z].*/,
  uppercase: /.*[A-Z].*/,
  number: /.*\d.*/,
  symbol: /.*[^a-zA-Z\d\s:].*/,
};

const validEmail = (str) => {
  const atposition = str.indexOf("@");
  const dotposition = str.lastIndexOf(".");
  const wrongEmail =
    atposition < 1 ||
    dotposition < atposition + 2 ||
    dotposition + 2 >= str.length ||
    str.length <= 5;
  return !wrongEmail;
};

class Validator {
  defaultSchema = {
    seperateNames: false,
    fullName: {
      min: 5,
      max: 50,
      required: true,
    },
    firstName: {
      min: 3,
      max: 50,
      required: true,
    },
    lastName: {
      min: 3,
      max: 50,
      required: false,
    },

    email: {
      required: true,
    },
    password: {
      min: 8,
      max: 50,
      required: {
        lowercase: false,
        uppercase: false,
        number: false,
        symbol: false,
      },
    },
  };

  constructor({ schema } = { schema: this.defaultSchema }) {
    this.schema = schema;
  }
  checkName = (obj) => {
    console.log(obj);
    if (!this.schema.seperateNames) {
      return {
        fullName: checklen(
          this.schema.fullName.min,
          this.schema.fullName.max,
          obj.fullName,
          false
        ),
      };
    } else {
      return {
        firstName: checklen(
          this.schema.firstName.min,
          this.schema.firstName.max,
          obj.firstName,
          true
        ),
        lastName: checklen(
          this.schema.lastName.min,
          this.schema.lastName.max,
          obj.lastName,
          true
        ),
      };
    }
  };

  checkEmail = (str) => {
    return checklen(8, 100, str) && validEmail(str);
  };

  checkPass = (str) => {
    return {
      length: checklen(
        this.schema.password.min,
        this.schema.password.max,
        str,
        true
      ),
      lowercase:
        !this.schema.password.required.lowercase || regex.lowercase.test(str),
      symbol: !this.schema.password.required.symbol || regex.symbol.test(str),
      number: !this.schema.password.required.number || regex.number.test(str),
      uppercase:
        !this.schema.password.required.uppercase || regex.uppercase.test(str),
    };
  };

  validate = ({
    signup = true,
    email,
    password,
    fullName,
    firstName,
    lastName,
  }) => {
    const errors = {};
    errors.email = this.checkEmail(email);
    errors.password = this.checkPass(password);
    if (!signup) return errors;
    errors.name = this.checkName({ fullName, firstName, lastName });
    return errors;
  };
}
module.exports = Validator;
