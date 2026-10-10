import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { applyFurnitureWood, projectFurnitureUvs } from './shelfMaterials';
import type { BoxCollider } from '../core/CollisionWorld';
export type HomeInterior = {
    colliders: BoxCollider[];
    update: () => void;
};
function add(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
function box(parent: THREE.Group, w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    return add(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(0.016, w / 5, h / 5, d / 5)), mat, x, y, z);
}
function createLeafMap(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, '#344a28');
    g.addColorStop(0.5, '#75945a');
    g.addColorStop(1, '#435e35');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 256);
    ctx.strokeStyle = 'rgba(196,204,142,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 256);
    ctx.stroke();
    for (let y = 20; y < 256; y += 22) {
        ctx.beginPath();
        ctx.moveTo(8, y - 17);
        ctx.lineTo(64, y);
        ctx.lineTo(120, y - 17);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
const foliage = new THREE.MeshStandardMaterial({ map: createLeafMap(), roughness: 0.74, side: THREE.DoubleSide });
const stemMat = new THREE.MeshStandardMaterial({ color: 0x66704b, roughness: 0.9 });
function plant(parent: THREE.Group, x: number, z: number, color: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    parent.add(group);
    const ceramic = new THREE.MeshStandardMaterial({ color, roughness: 0.52 });
    const points = [[0.18, 0.03], [0.2, 0.055], [0.205, 0.1], [0.26, 0.44], [0.28, 0.46], [0.28, 0.5], [0.25, 0.5], [0.245, 0.46]].map(([r, y]) => new THREE.Vector2(r, y));
    add(group, new THREE.LatheGeometry(points, 32), ceramic, 0, 0, 0);
    add(group, new THREE.CylinderGeometry(0.28, 0.29, 0.025, 32), ceramic, 0, 0.018, 0);
    const soil = add(group, new THREE.CircleGeometry(0.246, 32), new THREE.MeshStandardMaterial({ color: 0x45382d, roughness: 1 }), 0, 0.46, 0);
    soil.rotation.x = -Math.PI / 2;
    const rim = add(group, new THREE.TorusGeometry(0.266, 0.014, 8, 32), ceramic, 0, 0.48, 0);
    rim.rotation.x = Math.PI / 2;
    const geo = new THREE.PlaneGeometry(0.17, 0.42, 8, 12), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const v = p.getY(i) / 0.42 + 0.5;
        p.setX(i, p.getX(i) * Math.pow(Math.sin(v * Math.PI), 0.7));
        p.setZ(i, Math.sin(v * Math.PI) * 0.045 + Math.abs(p.getX(i)) * 0.25);
    }
    geo.computeVertexNormals();
    const leaves = new THREE.InstancedMesh(geo, foliage, 24);
    const dummy = new THREE.Object3D();
    for (let branch = 0; branch < 4; branch++) {
        const angle = branch * 2.4, end = new THREE.Vector3(Math.cos(angle) * 0.12, 1.12 + (branch % 2) * 0.24, Math.sin(angle) * 0.12);
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.46, 0), new THREE.Vector3(-end.x, 0.85, -end.z), end);
        add(group, new THREE.TubeGeometry(curve, 12, 0.006, 5, false), stemMat, 0, 0, 0);
        for (let i = 0; i < 6; i++) {
            const point = curve.getPoint(0.3 + i * 0.13), a = angle + i * 2.4;
            dummy.position.set(point.x + Math.cos(a) * 0.13, point.y + 0.035, point.z + Math.sin(a) * 0.13);
            dummy.rotation.set(Math.sin(a) * 0.8, a, Math.cos(a) * 0.8);
            dummy.scale.setScalar(0.75 + (i % 3) * 0.1);
            dummy.updateMatrix();
            leaves.setMatrixAt(branch * 6 + i, dummy.matrix);
        }
    }
    leaves.receiveShadow = true;
    group.add(leaves);
}
function cabinet(parent: THREE.Group): void {
    const group = new THREE.Group();
    group.position.set(-0.8, 0, 9.35);
    group.rotation.y = Math.PI;
    parent.add(group);
    const oak = new THREE.MeshStandardMaterial({ color: 0xf0dfc5, roughness: 0.58 });
    applyFurnitureWood(oak);
    const brass = new THREE.MeshStandardMaterial({ color: 0xa18355, metalness: 0.6, roughness: 0.4 });
    const wood = (w: number, h: number, d: number, x: number, y: number, z: number) => { const m = box(group, w, h, d, oak, x, y, z); projectFurnitureUvs(m.geometry, h > w ? 'vertical' : 'horizontal', y * 0.37 + x); return m; };
    for (const x of [-0.5, 0.5])
        for (const z of [-0.19, 0.19])
            wood(0.07, 0.18, 0.07, x, 0.09, z);
    wood(1.2, 0.62, 0.5, 0, 0.46, 0);
    wood(1.28, 0.055, 0.56, 0, 0.79, 0);
    for (const x of [-0.29, 0.29]) {
        wood(0.565, 0.5, 0.032, x, 0.47, 0.266);
        wood(0.48, 0.42, 0.012, x, 0.47, 0.288);
        box(group, 0.025, 0.09, 0.025, brass, x + (x > 0 ? -0.19 : 0.19), 0.5, 0.314);
    }
    const colors = [0x637561, 0xab7863, 0xc1a26e];
    for (let i = 0; i < 3; i++) {
        const book = new THREE.Group();
        book.position.set(-0.35, 0.84 + i * 0.048, 0.06);
        book.rotation.y = i * 0.09 - 0.08;
        group.add(book);
        const cover = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.88 }), pages = new THREE.MeshStandardMaterial({ color: 0xe7dec7, roughness: 1 });
        box(book, 0.32, 0.034, 0.22, pages, 0, 0, 0);
        for (const y of [-0.021, 0.021])
            box(book, 0.335, 0.008, 0.23, cover, 0, y, 0);
        box(book, 0.335, 0.04, 0.009, cover, 0, 0, -0.11);
    }
    const radio = new THREE.Group();
    radio.position.set(0.22, 0.97, 0.015);
    group.add(radio);
    box(radio, 0.48, 0.3, 0.19, oak, 0, 0, 0);
    const dark = new THREE.MeshStandardMaterial({ color: 0x302e27, roughness: 0.85 });
    box(radio, 0.43, 0.25, 0.012, dark, 0, 0, 0.099);
    const grill = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.005, 0.006), brass, 16);
    for (let i = 0; i < 16; i++)
        grill.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-0.07, -0.105 + i * 0.014, 0.11));
    radio.add(grill);
    box(radio, 0.09, 0.035, 0.012, new THREE.MeshStandardMaterial({ color: 0xd4c59b, roughness: 0.6 }), 0.15, 0.07, 0.112);
    for (const y of [-0.015, -0.085]) {
        const knob = add(radio, new THREE.CylinderGeometry(0.024, 0.024, 0.022, 16), brass, 0.15, y, 0.123);
        knob.rotation.x = Math.PI / 2;
    }
}
function clock(parent: THREE.Group): () => void {
    const group = new THREE.Group();
    group.position.set(-0.8, 2.05, 9.88);
    group.rotation.y = Math.PI;
    parent.add(group);
    const wood = new THREE.MeshStandardMaterial({ color: 0x74593b, roughness: 0.6 }), brass = new THREE.MeshStandardMaterial({ color: 0xa58859, metalness: 0.55, roughness: 0.45 });
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f1e9d6';
    ctx.fillRect(0, 0, 512, 512);
    ctx.translate(256, 256);
    ctx.strokeStyle = '#514b3e';
    for (let i = 0; i < 60; i++) {
        const a = i / 60 * Math.PI * 2, r = i % 5 === 0 ? 207 : 217;
        ctx.lineWidth = i % 5 === 0 ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.sin(a) * r, -Math.cos(a) * r);
        ctx.lineTo(Math.sin(a) * 230, -Math.cos(a) * 230);
        ctx.stroke();
    }
    ctx.fillStyle = '#514b3e';
    ctx.font = '30px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
        const a = i / 12 * Math.PI * 2;
        ctx.fillText(String(i), Math.sin(a) * 180, -Math.cos(a) * 180);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const body = add(group, new THREE.CylinderGeometry(0.3, 0.3, 0.065, 48), wood, 0, 0, 0);
    body.rotation.x = Math.PI / 2;
    add(group, new THREE.CircleGeometry(0.267, 48), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), 0, 0, 0.035).receiveShadow = false;
    add(group, new THREE.TorusGeometry(0.276, 0.019, 10, 48), brass, 0, 0, 0.036);
    const hands = [new THREE.Group(), new THREE.Group(), new THREE.Group()], handMat = new THREE.MeshStandardMaterial({ color: 0x343b32, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
        const length = [0.14, 0.2, 0.23][i], hand = hands[i];
        hand.position.z = 0.044 + i * 0.006;
        group.add(hand);
        box(hand, i === 2 ? 0.003 : 0.013, length, 0.006, i === 2 ? brass : handMat, 0, length / 2 - 0.014, 0);
    }
    add(group, new THREE.SphereGeometry(0.012, 12, 8), brass, 0, 0, 0.065);
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    let previous = -1;
    return () => {
        const now = Date.now(), second = Math.floor(now / 1000);
        if (second === previous)
            return;
        previous = second;
        const parts = formatter.formatToParts(new Date(now)), value = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
        const h = value('hour'), m = value('minute'), s = value('second');
        hands[0].rotation.z = -(h % 12 + m / 60 + s / 3600) * Math.PI / 6;
        hands[1].rotation.z = -(m + s / 60) * Math.PI / 30;
        hands[2].rotation.z = -s * Math.PI / 30;
    };
}
export function buildHomeInterior(parent: THREE.Group): HomeInterior {
    cabinet(parent);
    plant(parent, -3.9, -9.1, 0xb7866a);
    plant(parent, 3.9, 9.1, 0xb4b9a5);
    const update = clock(parent);
    update();
    return { update, colliders: [{ cx: -0.8, cz: 9.35, halfW: 0.64, halfD: 0.32, rotY: Math.PI }, { cx: -3.9, cz: -9.1, halfW: 0.29, halfD: 0.29, rotY: 0 }, { cx: 3.9, cz: 9.1, halfW: 0.29, halfD: 0.29, rotY: 0 }] };
}
