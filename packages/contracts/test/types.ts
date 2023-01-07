

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import type { LensHub } from '../types/contracts/lens/LensHub'



type Fixture<T> = () => Promise<T>;

declare module 'mocha' {
  export interface Context {
    lensHub: LensHub;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  roundOperator: SignerWithAddress;
  user: SignerWithAddress;
  admin: SignerWithAddress;
  gov: SignerWithAddress;
  userTwo: SignerWithAddress;
}

