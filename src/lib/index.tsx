import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

interface TagDescription {
  tag: string;
  name?: string;
  ref: { current: HTMLElement | null };
}

const cascadingTags = ["title", "meta"];
const getTagType = (tag: TagDescription) =>
  tag.tag + (tag.name ? `.${tag.name}"` : "");

function useProviderValue() {
  const cascadedTagInstances = useRef(
    new Map<string, (TagDescription | null)[]>()
  );
  const value = useMemo(
    () => ({
      addClientTag: (tag: TagDescription) => {
        // consider only cascading tags
        const tagType = getTagType(tag);

        if (cascadingTags.indexOf(tag.tag) !== -1) {
          let instances = cascadedTagInstances.current.get(tagType) || [];
          const index = instances.length;
          instances = [...instances, tag];

          // track indices synchronously
          cascadedTagInstances.current.set(tagType, instances);

          let lastVisited = null;
          for (var i = index - 1; i >= 0; i--) {
            if (instances[i] != null) {
              lastVisited = instances[i];
              break;
            }
          }
          // unmount previous instance
          lastVisited?.ref.current?.remove();
          return index;
        }
        return -1;
      },
      removeClientTag: (tag: TagDescription, index: number) => {
        const tagName = getTagType(tag);

        if (tag.ref) {
          const instances = cascadedTagInstances.current.get(tagName);
          if (instances) {
            if (tag.ref.current?.parentNode) {
              for (let i = index - 1; i >= 0; i--) {
                if (instances[i] != null) {
                  document.head.appendChild(instances[i]?.ref.current!);
                }
              }
            }

            instances[index] = null;
            cascadedTagInstances.current.set(tagName, instances);
          }
        }
      },
    }),
    []
  );
  return value;
}

export type Context = ReturnType<typeof useProviderValue>;

const MetaContext = createContext<Context | undefined>(undefined);
MetaContext.displayName = "MetaProvider";

export const MetaProvider: React.FC<React.PropsWithChildren> = (props) => {
  const value = useProviderValue();
  return <MetaContext.Provider value={value} {...props} />;
};

export const MetaTag = (
  Tag: any,
  tagDescription: TagDescription,
  props: Record<string, any>
) => {
  useHead(tagDescription);
  return createPortal(
    <Tag ref={tagDescription.ref} {...props} />,
    document.head
  );
};

export function useHead(tagDesc: TagDescription) {
  const context = useContext(MetaContext);
  if (context === undefined) {
    throw new Error("Meta components can ony be used under <MetaProvider />");
  }
  const { addClientTag, removeClientTag } = context;

  useLayoutEffect(() => {
    let index = addClientTag(tagDesc);
    return () => removeClientTag(tagDesc, index);
  }, [tagDesc]);
}

export const Title = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLTitleElement>,
    HTMLTitleElement
  >
) => {
  const tagDescription = useMemo(() => {
    return {
      tag: "title",
      get name() {
        return props.property;
      },
      ref: { current: null as null | HTMLElement },
    };
  }, [props.property]);
  return MetaTag("title", tagDescription, props);
};
