import bcryptjs from 'bcryptjs';
import { User } from '../modules/user/user.model';
import { envVars } from '../config/env';
import { IAuthProvider, IUser, Role } from '../modules/user/user.interface';

export const createSuperAdmin = async () => {
  try {
    const isAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log('Super Admin Already Exists!');
      return;
    }

    const isHashPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      envVars.BCRYPT_SALT_ROUND
    );

    const authProvider: IAuthProvider = {
      provider: 'email',
      providerId: envVars.SUPER_ADMIN_EMAIL,
    };
    const payload: IUser = {
      name: envVars.SUPER_ADMIN_NAME,
      role: Role.SUPER_ADMIN,
      email: envVars.SUPER_ADMIN_EMAIL,
      address: 'Dhaka',
      phone: '+8801791732611',
      password: isHashPassword,
      isVerified: true,
      auths: [authProvider],
    };

    const superAdmin = await User.create(payload);
    console.log(superAdmin);
  } catch (error) {
    console.log(error);
  }
};
