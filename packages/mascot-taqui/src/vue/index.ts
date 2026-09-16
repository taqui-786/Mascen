import { defineComponent, h, onMounted, onBeforeUnmount, ref, watch, type PropType } from 'vue'
import { createMascot, type MascotHandle } from '../runtime/create-mascot'
import type { Expression, Look } from '../runtime/atlas'

export const Mascot = defineComponent({
  name: 'Mascot',
  props: {
    directions: { type: String, default: '/mascots/taqui-directions.webp' },
    reactions: { type: String, default: '/mascots/taqui-reactions.webp' },
    size: { type: Number, default: 240 },
    label: { type: String, default: 'Taqui' },
    className: { type: String, default: '' },
    goToSleep: { type: Boolean, default: false },
    reaction: { type: String as PropType<Expression | null>, default: null },
    look: { type: String as PropType<Look>, default: undefined },
    idleBlink: { type: Boolean, default: false },
    followPointer: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
  },
  emits: {
    boop: () => true,
    look: (_look: Look) => true,
    expression: (_value: Expression | null) => true,
  },
  setup(props, { emit, attrs }) {
    const host = ref<HTMLButtonElement | null>(null)
    let handle: MascotHandle | null = null

    function mount() {
      if (!host.value) return
      handle?.destroy()
      handle = createMascot(host.value, {
        directions: props.directions,
        reactions: props.reactions,
        size: props.size,
        label: props.label,
        goToSleep: props.goToSleep,
        reaction: props.reaction,
        look: props.look,
        idleBlink: props.idleBlink,
        followPointer: props.followPointer,
        disabled: props.disabled,
        onBoop: () => emit('boop'),
        onLook: (look) => emit('look', look),
        onExpression: (value) => emit('expression', value),
      })
    }

    onMounted(mount)
    onBeforeUnmount(() => handle?.destroy())
    watch(
      () => [
        props.directions,
        props.reactions,
        props.size,
        props.label,
        props.goToSleep,
        props.reaction,
        props.look,
        props.idleBlink,
        props.followPointer,
        props.disabled,
      ],
      () => {
        handle?.update({
          directions: props.directions,
          reactions: props.reactions,
          size: props.size,
          label: props.label,
          goToSleep: props.goToSleep,
          reaction: props.reaction,
          look: props.look,
          idleBlink: props.idleBlink,
          followPointer: props.followPointer,
          disabled: props.disabled,
        })
      },
    )

    return () =>
      h('button', {
        ref: host,
        type: 'button',
        class: props.className || attrs.class,
      })
  },
})

export default Mascot
