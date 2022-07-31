import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface TagDescription {
  tag: string;
  name?: string;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
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
          lastVisited?.setShow(false);
          return index;
        }
        return -1;
      },
      removeClientTag: (tag: TagDescription, index: number) => {
        const tagName = getTagType(tag);

        const instances = cascadedTagInstances.current.get(tagName);
        if (instances) {
          for (let i = index - 1; i >= 0; i--) {
            if (instances[i] != null) {
              instances[i]?.setShow(true);
              break;
            }
          }

          instances[index] = null;
          cascadedTagInstances.current.set(tagName, instances);
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
  const [show, setShow] = useState(true);
  tagDescription.setShow = setShow;
  useHead(tagDescription);
  if (!show) {
    return null;
  }
  return createPortal(<Tag {...props} />, document.head);
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
      setShow: () => {},
    };
  }, [props.property]);
  return MetaTag("title", tagDescription, props);
};
