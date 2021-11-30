/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { Resolver, Mutation, Arg } from 'type-graphql';
import {
  AuthRegisterInput,
  AuthRegisterResponse,
  AuthLoginInput,
} from '../types/authentication';
import { UserModel } from '../models/users-model';

@Resolver()
class AuthResolver {
  @Mutation(() => AuthRegisterResponse)
  async register(
    @Arg('body')
    { lastname, firstname, password, mail, classroom, role }: AuthRegisterInput,
  ): Promise<AuthRegisterResponse> {
    const isAlreadyRegisteredUser = await UserModel.findOne({ mail });

    if (isAlreadyRegisteredUser) {
      throw new Error('Email already exist, please use an another one');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user = new UserModel({
      lastname,
      firstname,
      mail,
      password: hashedPassword,
      classrooms: [classroom],
      role,
    });

    user.save();

    const token: string = jwt.sign(
      { id: user._id, mail },
      process.env.SECRET_KEY || 'secretOrPrivateKey',
    );
    console.log('res %s:', { ...user._doc, token });
    return { id: user._doc._id, ...user._doc, token };
  }

  @Mutation(() => AuthRegisterResponse)
  async login(
    @Arg('body')
    { mail, password }: AuthLoginInput,
  ): Promise<AuthRegisterResponse> {
    const user = await UserModel.findOne({ mail });

    if (!user) {
      throw new Error('Wrong password or email does not exist');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new Error('Wrong password or email does not exist');
    }

    const token: string = jwt.sign(
      { id: user._id, mail },
      process.env.SECRET_KEY || 'secretOrPrivateKey',
    );

    return { id: user._doc._id, ...user._doc, token };
  }
}

export default AuthResolver;
