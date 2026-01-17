import { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { useInternetIdentity } from './useInternetIdentity';

// Canister ID - will be set from environment or dfx
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const HOST = import.meta.env.VITE_IC_HOST || 'http://127.0.0.1:4943';

// Type for the actor - will be properly typed after running dfx generate
type ActorType = any;

// Lazy load IDL factory to avoid errors if declarations don't exist
let idlFactoryCache: any = null;
let idlFactoryPromise: Promise<any> | null = null;

async function loadIdlFactory() {
  if (idlFactoryCache) return idlFactoryCache;
  if (idlFactoryPromise) return idlFactoryPromise;

  idlFactoryPromise = (async () => {
    try {
      // Use dynamic import with a string to avoid build-time resolution
      const declarations = await import(/* @vite-ignore */ '../declarations/resona');
      idlFactoryCache = declarations.idlFactory;
      return idlFactoryCache;
    } catch (error) {
      // Silently fail - declarations will be generated later
      return null;
    }
  })();

  return idlFactoryPromise;
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const [actor, setActor] = useState<ActorType | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!identity) {
      setActor(null);
      setIsFetching(false);
      return;
    }

    async function createActor() {
      try {
        const agent = new HttpAgent({
          identity,
          host: HOST,
        });

        // For local development, we need to fetch the root key
        if (HOST.includes('127.0.0.1') || HOST.includes('localhost')) {
          await agent.fetchRootKey().catch((err) => {
            console.warn('Unable to fetch root key:', err);
          });
        }

        // Load IDL factory
        const idlFactory = await loadIdlFactory();
        
        if (!idlFactory) {
          console.warn('IDL factory not found. Run "dfx generate" to generate TypeScript bindings.');
          console.warn('The app will run but backend calls will not work until declarations are generated.');
          setActor(null);
          setIsFetching(false);
          return;
        }

        const actorInstance = Actor.createActor(idlFactory, {
          agent,
          canisterId: CANISTER_ID,
        });

        setActor(actorInstance);
        setIsFetching(false);
      } catch (error) {
        console.error('Error creating actor:', error);
        setActor(null);
        setIsFetching(false);
      }
    }

    createActor();
  }, [identity]);

  return { actor, isFetching };
}
