import React from "react";
import { ethers } from "ethers";
import { Modal } from "./Modal";

type ContextShape = {
  chainId: number,
  address: string | null,
  connect: Function,
  provider: ethers.providers.Web3Provider | null,
}

const Context = React.createContext<ContextShape>({
  chainId: 1,
  address: null,
  connect: () => {},
  provider: null,
});
const Provider = (props: React.PropsWithChildren<{}>) => {
  const initializedListenersRef = React.useRef<boolean>(false);

  const [chainId, setChainId] = React.useState<number>(1);
  const [address, setAddress] = React.useState<string | null>(null);
  const [connector, setConnector] = React.useState<Connector | null>(null);
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [web3Provider, setWeb3Provider] =
    React.useState<ethers.providers.Web3Provider | null>(null);

  /**
   * Autoconnect if a connector has been cached
   */
  React.useEffect(() => {
    const cachedConnector = getCachedConnector();
    if (cachedConnector !== null) {
      initWeb3Provider(cachedConnector);
    }
  }, []);

  /**
   * Initialize required ethereum event listeners once a connection has been
   * established, driven by the currently used connector.
   */
  React.useEffect(() => {
    if (
      connector === null ||
      web3Provider === null ||
      web3Provider.provider === null ||
      initializedListenersRef.current ||
      typeof (web3Provider.provider as any).on !== "function"
    ) {
      return;
    }

    if (typeof connector.chainChange === "function") {
      // @ts-ignore: checked above
      web3Provider.provider.on(
        ...connector.chainChange((id: number) => {
          setChainId(id);
        })
      );
    }
    if (typeof connector.disconnect === "function") {
      // @ts-ignore: checked above
      web3Provider.provider.on(
        ...connector.disconnect(() => {
          setAddress(null);
          setWeb3Provider(null);
          clearCachedConnector();
        })
      );
    }
    if (typeof connector.accountChange === "function") {
      // @ts-ignore: checked above
      web3Provider.provider.on(
        ...connector.accountChange(async (address: string) => {
          // TODO
        })
      );
    }

    initializedListenersRef.current = true;
  }, [connector, web3Provider]);

  const connect = React.useCallback(async function () {
    // @ts-ignore
    initWeb3Provider(connectors.get(ConnectorName.METAMASK));
  }, []);

  /**
   * Web3Context.initWeb3Provider
   */
  const initWeb3Provider = React.useCallback(async (connector: Connector) => {
    try {
      const provider = await connector.connect();
      const accounts = await provider.listAccounts();
      const networkId = (await provider.getNetwork()).chainId;

      setWeb3Provider(provider);

      setChainId(networkId);
      setConnector(connector);
      setModalOpen(false);
      setAddress(accounts[0]);

      setCachedConnector(connector);
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <Context.Provider
      value={{
        address,
        chainId,
        connect,
        provider: web3Provider,
      }}
    >
      {props.children}
      {/* <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        // @ts-ignore
        onConnector={(connector) => initWeb3Provider(connector)}
      /> */}
    </Context.Provider>
  );
};

type Connector = {
  id: ConnectorName;
  name: string;
  connect: () => Promise<ethers.providers.Web3Provider>; // Must handle errors try/catch
  disconnect?: (handler: () => void) => [string, Function];
  chainChange?: (handler: (id: number) => void) => [string, Function],
  accountChange?: (handler: (address: string) => void) => [string, Function];
};

enum ConnectorName {
  METAMASK = "METAMASK",
}

const metamaskConnector: Connector = {
  id: ConnectorName.METAMASK,
  name: "Metamask",
  connect: async () => {
    // Anything here can throw!!!
    // Check to see if window.etherem is being provided by Metamask
    const { ethereum } = window as any;
    if (!Boolean(ethereum && ethereum.isMetaMask)) throw new Error();

    await ethereum.request({ method: "eth_requestAccounts" });
    return new ethers.providers.Web3Provider(ethereum);
  },
  chainChange: (handler) => [
    "chainChanged",
    (chainId: string) => {
      handler(Number(chainId));
    }
  ],
  disconnect: (handler) => [
    "accountsChanged",
    (accounts: string[]) => {
      if (accounts.length === 0) handler();
    },
  ],
  accountChange: (handler) => [
    "accountsChanged",
    (accounts: string[]) => {
      const [address] = accounts;
      if (address) handler(address);
    },
  ],
};

const connectors: Map<ConnectorName, Connector> = new Map([
  [ConnectorName.METAMASK, metamaskConnector],
]);

const KEYS = {
  CONNECTOR: "hexWar.connector",
}

export const setCachedConnector = (connector: Connector) => {
  localStorage.setItem(KEYS.CONNECTOR, connector.id);
}
export const getCachedConnector = (): Connector | null => {
  const raw = localStorage.getItem(KEYS.CONNECTOR);

  if (typeof raw !== "string") return null;
  if (!Array.from(connectors.keys()).includes(raw as any)) return null;

  return connectors.get(raw as ConnectorName) || null;
}
export const clearCachedConnector = () => {
  localStorage.removeItem(KEYS.CONNECTOR);
}

type ConnectModalProps = any & {
  onConnector: (connector: Connector) => any;
};

const ConnectModal = ({ onConnector, ...modalProps }: ConnectModalProps) => (
  <Modal {...modalProps}>
    <div>
        {Array.from(connectors.entries()).map(([id, connector]) => (
          <button id={id} key={id} onClick={() => onConnector(connector)}>
              <div>
                {connector.name}
              </div>
          </button>
        ))}
    </div>
  </Modal>
);

export { connectors };
export { ConnectorName };
export type { Connector };

export { Context };
export default Provider;
