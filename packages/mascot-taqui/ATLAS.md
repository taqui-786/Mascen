# Atlas contract

Taqui is two 3×3 sprite sheets. The runtime never infers cell order — this file is the contract.

Both sheets are square. Each cell is one third of the image. The runtime sets `background-size: 300% 300%` and `background-position` to `0% / 50% / 100%` on each axis.

## Look sheet (`taqui-directions.webp`)

Row-major, y-down:

| | left | center | right |
| --- | --- | --- | --- |
| **up** | `up-left` | `up` | `up-right` |
| **mid** | `left` | `center` | `right` |
| **down** | `down-left` | `down` | `down-right` |

The pointer is mapped onto this pad in the mascot’s local space. The middle cell is a dead zone that **scales with `size`**. Switching cells uses a margin (hysteresis) so the head does not chatter on a boundary.

## Expression sheet (`taqui-reactions.webp`)

Row-major:

| | 0 | 1 | 2 |
| --- | --- | --- | --- |
| **0** | `blink` | `heart` | `sparkle` |
| **1** | `surprised` | `wink` | `bashful` |
| **2** | `sleepy` | `dizzy` | `delighted` |

Changing this order requires new art. The mascot editor (later) should read and write this same grid.
