import os
import random
import sys
import json

import time

import multiprocessing
import Queue

import signal

import tools

running = True


def target(candidate_block, queue):
    if 'nonce' in candidate_block:
        candidate_block.pop('nonce')
    halfHash = tools.det_hash(candidate_block)
    candidate_block['nonce'] = random.randint(0, 10000000000000000000000000000000000000000)
    current_hash = tools.det_hash({'nonce': candidate_block['nonce'], 'halfHash': halfHash})
    while current_hash > candidate_block['target']:
        candidate_block['nonce'] += 1
        current_hash = tools.det_hash({'nonce': candidate_block['nonce'], 'halfHash': halfHash})
    if current_hash <= candidate_block['target']:
        queue.put(candidate_block)


def run(args):
    def is_everyone_dead(pool):
        for p in pool:
            if p.is_alive():
                return False
        return True

    candidate_block = json.load(open(args[1], 'r'))

    print os.getpid()

    from multiprocessing import Process
    pool = []
    queue = multiprocessing.Queue()
    for i in range(8):
        p = Process(target=target, args=[candidate_block, queue])
        p.daemon = True
        p.start()
        pool.append(p)

    possible_block = None
    while not is_everyone_dead(pool) and running:
        try:
            possible_block = queue.get(timeout=0.5)
            break
        except Queue.Empty:
            pass

    if possible_block is not None:
        f = open(args[1]+'_mined', 'w')
        f.write(json.dumps(possible_block))
        f.flush()
        f.close()
        exit(0)
    exit(1)


def handler(sig, a):
    global running
    running = False


def main():

    if len(sys.argv) < 2:
        sys.stderr.write('Not enough arguments!\n')
        exit(1)
    signal.signal(signal.SIGTERM, handler)
    run(sys.argv)
    exit(0)

main()
