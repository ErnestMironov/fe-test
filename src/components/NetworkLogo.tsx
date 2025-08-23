import React from 'react';
import { chainIdToName } from '../../test-task-types';
import EthIcon from '@/assets/icons/eth.png';
import SolIcon from '@/assets/icons/sol.png';
import BaseIcon from '@/assets/icons/base.png';
import BscIcon from '@/assets/icons/bsc.png';

interface NetworkLogoProps {
  chainId: number;
}

export const NetworkLogo: React.FC<NetworkLogoProps> = ({ chainId }) => {
  const chainName = chainIdToName(chainId);

  const getNetworkIcon = (chain: string) => {
    switch (chain) {
      case 'ETH':
        return EthIcon;
      case 'SOL':
        return SolIcon;
      case 'BASE':
        return BaseIcon;
      case 'BSC':
        return BscIcon;
      default:
        return EthIcon;
    }
  };

  const IconComponent = getNetworkIcon(chainName);

  return (
    <img src={IconComponent} alt={chainName} className="w-4 h-4 rounded-full" />
  );
};
