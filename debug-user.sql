SELECT u.id, u.email, u."isAdmin", uc.password FROM "User" u LEFT JOIN "UserCredentials" uc ON u.id = uc."userId" WHERE u.email = 'sean.li@smtengo.com';
